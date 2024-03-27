import fs from "fs";
import puppeteer, { Browser } from "puppeteer";
import { Product } from "./types";

interface Category {
  name: string;
  url: string;
}

interface StackInterface {
  category: string;
  url: string;
}

class Scrapper {
  browser: Browser | null = null;
  baseUrl = "https://wazobia.market/?product_cat=0&post_type=product&s=";
  stack: StackInterface[] = [];
  products: Product[] = [];

  categories: Category[] = [];

  constructor() {
    this.init();
  }

  init() {
    console.log("Initializing...");

    // create data directory
    if (!fs.existsSync("./data")) {
      fs.mkdirSync("./data");
    }

    // create products file
    if (!fs.existsSync("./data/products.json")) {
      fs.writeFileSync("./data/products.json", JSON.stringify([]));
    }

    // create stack file
    if (!fs.existsSync("./data/stack.json")) {
      fs.writeFileSync("./data/stack.json", JSON.stringify([]));
    }
  }

  async openBrowser() {
    console.log("Opening browser...");

    const browser = await puppeteer.launch({
      headless: true,
    });

    this.browser = browser;
  }

  async getCategories() {
    console.log("Getting categories...");

    const page = await this.browser?.newPage();
    await page?.goto(this.baseUrl);

    const categories = (await page?.evaluate(() => {
      const categories = Array.from(
        document.querySelectorAll(
          ".wc-block-product-categories-list--depth-0 > .wc-block-product-categories-list-item > a",
        ),
      ).map((category) => {
        return {
          name: category.textContent,
          url: category.getAttribute("href"),
        };
      });

      return categories;
    })) as Category[];

    this.categories = categories;
    console.log("Categories: ", this.categories);
  }

  async getProductLinks() {
    console.log("Getting product links...");

    const page = await this.browser?.newPage();

    for (let category of this.categories) {
      let error = false;
      let index = 1;
      do {
        if (index === 1) await page?.goto(category.url);
        else await page?.goto(`${category.url}/page/${index + 1}`);
        index++;

        const productLinks: StackInterface[] | null = (await page?.evaluate(
          () => {
            if (document.querySelector("article.not_found")) return null;
            const links = Array.from(
              document.querySelectorAll(".yit-wcan-container .products li > a"),
            ).map((link) => {
              return {
                url: link.getAttribute("href"),
              };
            });

            return links;
          },
        )) as StackInterface[] | null;

        if (!productLinks) error = true;
        else {
          this.stack = [
            ...this.stack,
            ...productLinks.map((link) => ({
              ...link,
              category: category.name,
            })),
          ];
          fs.writeFileSync("./data/stack.json", JSON.stringify(this.stack));
        }
      } while (!error);

      fs.writeFileSync("./data/stack.json", JSON.stringify(this.stack));
    }
  }

  async getProductDetails() {
    console.log("Getting product details...");

    const page = await this.browser?.newPage();

    while (this.stack.length > 0) {
      const product = this.stack.pop();
      if (!product) break;
      try {
        new URL(product.url);
      } catch (error) {
        fs.writeFileSync("./data/stack.json", JSON.stringify(this.stack));
        continue;
      }
      await page?.goto(product.url);

      const productDetails = (await page?.evaluate(() => {
        const id = crypto.randomUUID().toString();
        const name = document.querySelector(".product_title")?.textContent;
        let price = null;
        let priceRange = null;
        if (
          document.querySelectorAll(".summary .price .woocommerce-Price-amount")
            .length > 1
        ) {
          priceRange = {
            min: Number(
              document
                .querySelectorAll(
                  ".summary .price .woocommerce-Price-amount",
                )?.[0]
                ?.textContent?.replace(/[^0-9.]/g, ""),
            ),
            max: Number(
              document
                .querySelectorAll(
                  ".summary .price .woocommerce-Price-amount",
                )?.[1]
                ?.textContent?.replace(/[^0-9.]/g, ""),
            ),
          };
          price = priceRange.min;
        } else {
          price = Number(
            document
              .querySelector(".price .woocommerce-Price-amount")
              ?.textContent?.replace(/[^0-9.]/g, "") || "0",
          );
        }
        const description =
          document.querySelector("#tab-description")?.textContent?.trim() ||
          document
            .querySelector(".woocommerce-product-details__short-description")
            ?.textContent?.trim();
        const images = Array.from(
          document.querySelectorAll(".woocommerce-product-gallery__image a"),
        ).map((image) => image.getAttribute("href"));

        return {
          id,
          name,
          price,
          priceRange,
          description,
          images,
          link: window.location.href,
        };
      })) as Product;

      productDetails.category = product.category;

      const variantsLength = await page?.evaluate(() => {
        return document.querySelectorAll(".pro-swatches-wrapper span").length;
      });
      if (variantsLength && variantsLength > 0) {
        productDetails.productVariants = [];
        for (let i = 0; i < variantsLength; i++) {
          try {
            await page?.click(
              `.pro-swatches-wrapper span:nth-of-type(${i + 1})`,
            );
          } catch (error) {
            continue;
          }
          await new Promise((resolve) => setTimeout(resolve, 0));
          await page?.waitForFunction(
            () => !document.querySelector(".blockUI.blockOverlay"),
          );
          const weight = (await page?.evaluate(() => {
            return document
              .querySelector(".pro-swatches-wrapper span")
              ?.textContent?.trim();
          })) as string;
          const price = (await page?.evaluate(() => {
            return Number(
              document
                .querySelector(".woocommerce-variation.single_variation")
                ?.textContent?.replace(/[^0-9.]/g, "") || "0",
            );
          })) as number;
          productDetails.productVariants?.push({ weight, price });
        }
      }

      this.products.push(productDetails);
      fs.writeFileSync("./data/products.json", JSON.stringify(this.products));
      fs.writeFileSync("./data/stack.json", JSON.stringify(this.stack));
    }
  }

  async start() {
    const stack = (() => {
      let stack: StackInterface[] = [];
      const file = fs.readFileSync("./data/stack.json", "utf-8");
      if (file) stack = JSON.parse(file);
      return stack;
    })();
    this.stack = stack;

    const products = (() => {
      let products: Product[] = [];
      const file = fs.readFileSync("./data/products.json", "utf-8");
      if (file) products = JSON.parse(file);
      return products;
    })();
    this.products = products;

    await this.openBrowser();
    if (stack.length === 0 && products.length === 0) await this.getCategories();
    if (stack.length === 0) await this.getProductLinks();
    await this.getProductDetails();
    await this.browser?.close();
    console.log("Done!");
  }
}

export const scrapper = new Scrapper();
