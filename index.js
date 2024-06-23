import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  database: "world",
  host: "localhost",
  user: "postgres",
  password: "12345",
  port: 5433,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisisted() {
  const result = await db.query("SELECT * FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(countries);
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", { total: countries.length, countries: countries });
});

app.post("/add", async (req, res) => {
  const input = req.body.country;
  try {
    const request = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",[input.toLowerCase()]);
    const data = request.rows[0].country_code;
    try {
      await db.query(`INSERT INTO visited_countries(country_code) VALUES($1)`,[data]);
      res.redirect("/");
    } catch (error) {
      const countries = await checkVisisted();
      res.render("index.ejs", {total: countries.length, countries: countries, error:"Country is already added! Enter another one: "});
    }
  } catch (error) {
    const countries = await checkVisisted();
    console.log(error)
    res.render("index.ejs", {total: countries.length, countries: countries, error:"Country was not found! Enter another one: "});
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});