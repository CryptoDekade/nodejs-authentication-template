| ![GitHub repo size](https://img.shields.io/github/repo-size/CryptoDekade/nodejs-authentication-template?style=for-the-badge) | ![GitHub](https://img.shields.io/github/license/CryptoDekade/nodejs-authentication-template?style=for-the-badge) |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |

# NodeJS Authentication Template

This is a template for handling user authentication and authorization using **NodeJS**, **Express**, **MongoDB** and **JWT**.

## Tech Stack

**Client:** [Boostrap](https://getbootstrap.com/)

**Server:** [Node](https://nodejs.org/), [Express](https://expressjs.com/), [MongoDB](https://www.mongodb.com/), [JWT](https://www.npmjs.com/package/jsonwebtoken)

## Features

The template has a number of features:

-   Login Authentication
-   Session Authorization

## Run Locally

This template uses a custom [Bootstrap](https://getbootstrap.com/) theme included in the repository.

If you want to use a different instance simply replace `bootstrap.min.css` in the `/public/css/` folder with your own.

Alternatively, you can delete `bootstrap.min.css` and link to the [Bootstrap](https://getbootstrap.com/) CDN inside `/views/partials/head.ejs`

#### Clone the project

```bash
  git clone https://github.com/CryptoDekade/nodejs-authentication-template.git
```

#### Go to the project directory

```bash
  cd my-project
```

#### Install dependencies

```bash
  npm install
```

#### Start the server

```bash
  npm run start
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`MONGO_DB`

`ACCESS_TOKEN_SECRET`

`REFRESH_TOKEN_SECRET`

## Authors

-   [@CryptoDekade](https://www.github.com/CryptoDekade)

## License

[GNU General Public License v3.0](https://choosealicense.com/licenses/gpl-3.0/)
