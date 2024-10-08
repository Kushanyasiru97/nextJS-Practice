import fs from "node:fs";
import sql from "better-sqlite3";
import slugify from "slugify";
import xss from "xss";

const db = sql('meals.db');

export async function getMeals() {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return db.prepare('SELECT * FROM meals').all();
}

export async function getMeal(slug) {
    return db.prepare('SELECT * FROM meals WHERE slug=?').get(slug);
}

export async function saveMeal(meal) {
    meal.slug = slugify(meal.title, { lower: true });
    const instructions = xss(meal.instructions);

    // Assuming meal.image is a file object with 'name' property (e.g., from form upload)
    if (typeof meal.image.name !== "string") {
        throw new Error("Invalid image format");
    }

    const extension = meal.image.name.split(".").pop();
    const fileName = `${meal.slug}.${extension}`;

    const stream = fs.createWriteStream(`public/images/${fileName}`);
    const bufferImage = await meal.image.arrayBuffer();

    stream.write(Buffer.from(bufferImage), (error) => {
        if (error) {
            throw new Error("Image Saving Failed...!");
        }
    });

    meal.image = `/images/${fileName}`;

    db.prepare(`
        INSERT INTO meals
        (slug, title, image, summary, instructions, creator, creator_email)
        VALUES (
            @slug,
            @title,
            @image,
            @summary,
            @instructions,
            @creator,
            @creator_email
        )
    `).run(meal);
}
