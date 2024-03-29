import fs from "fs";

interface ProductVariant {
  weight: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  priceRange?: { min: number; max: number };
  images: string[];
  link: string;
  category: string;
  productVariants?: ProductVariant[];
  description?: string;
}

function jsonToCsv(products: Product[]): string {
  let csv =
    'ID,Type,SKU,Name,Published,"Is featured?","Visibility in catalog","Short description",Description,"Date sale price starts","Date sale price ends","Tax status","Tax class","In stock?",Stock,"Low stock amount","Backorders allowed?","Sold individually?","Weight (kg)","Length (cm)","Width (cm)","Height (cm)","Allow customer reviews?","Purchase note","Sale price","Regular price",Categories,Tags,"Shipping class",Images,"Download limit","Download expiry days",Parent,"Grouped products",Upsells,Cross-sells,"External URL","Button text",Position,"Swatches Attributes","Attribute 1 name","Attribute 1 value(s)","Attribute 1 visible","Attribute 1 global","Attribute 1 default"\n';

  products.forEach((product) => {
    const { id, name, price, images, category, productVariants, description } =
      product;

    if (productVariants && productVariants.length > 0) {
      productVariants.forEach((variant, variantIndex) => {
        const csvRow = [
          id + "-" + (variantIndex + 1), // Variant ID
          "variation", // Type
          "", // SKU
          name.trim() + " - " + variant.weight, // Name with variant
          "1", // Published
          "0", // Is featured?
          "visible", // Visibility in catalog
          "", // Short description
          // description
          //   ?.trim()
          //   ?.replace(/\n/g, "[NEWLINE]")
          //   ?.replace(/,/g, "[COMMA]") || "", // Description
          `"${
            description?.trim()?.replace(/"/g, "'")?.replace(/\n/g, "\\n") || ""
          }"`, // Description
          "", // Date sale price starts
          "", // Date sale price ends
          "taxable", // Tax status
          "", // Tax class
          "1", // In stock?
          "100", // Stock
          "", // Low stock amount
          "0", // Backorders allowed?
          "", // Sold individually?
          "", // Weight (kg)
          "", // Length (cm)
          "", // Width (cm)
          "", // Height (cm)
          "1", // Allow customer reviews?
          "", // Purchase note
          variant.price.toString(), // Sale price
          price.toString(), // Regular price
          `"${category}"`, // Categories
          "", // Tags
          "", // Shipping class
          `"${images.join(", ")}"`, // Images
          "", // Download limit
          "", // Download expiry days
          id, // Parent
          "", // Grouped products
          "", // Upsells
          "", // Cross-sells
          "", // External URL
          "", // Button text
          "", // Position
          "color", // Swatches Attributes
          "Color", // Attribute 1 name
          variant.weight, // Attribute 1 value(s)
          "1", // Attribute 1 visible
          "1", // Attribute 1 global
          variantIndex === 0 ? "1" : "", // Attribute 1 default
        ];

        csv += csvRow.join(",") + "\n";
      });
    } else {
      const csvRow = [
        id, // ID
        "simple",
        "", // SKU
        name.trim(),
        "1", // Published
        "0", // Is featured?
        "visible", // Visibility in catalog
        "", // Short description
        `"${
          description?.trim()?.replace(/"/g, "'")?.replace(/\n/g, "\\n") || ""
        }"`, // Description
        "", // Date sale price starts
        "", // Date sale price ends
        "taxable", // Tax status
        "", // Tax class
        "1", // In stock?
        "100", // Stock
        "", // Low stock amount
        "0", // Backorders allowed?
        "", // Sold individually?
        "", // Weight (kg)
        "", // Length (cm)
        "", // Width (cm)
        "", // Height (cm)
        "1", // Allow customer reviews?
        "", // Purchase note
        price.toString(), // Sale price
        price.toString(), // Regular price
        `"${category}"`, // Categories
        "", // Tags
        "", // Shipping class
        `"${images.join(", ")}"`, // Images
        "", // Download limit
        "", // Download expiry days
        "", // Parent
        "", // Grouped products
        "", // Upsells
        "", // Cross-sells
        "", // External URL
        "", // Button text
        "", // Position
        "", // Swatches Attributes
        "", // Attribute 1 name
        "", // Attribute 1 value(s)
        "", // Attribute 1 visible
        "", // Attribute 1 global
        "", // Attribute 1 default
      ];

      csv += csvRow.join(",") + "\n";
    }
  });

  return csv;
}

const json = fs.readFileSync("./data/products.json", "utf-8");
const products: Product[] = JSON.parse(json);

const csv = jsonToCsv(products);
fs.writeFileSync("./data/products.csv", csv);
