# Railway Desktop & Web

## Setup

- `yarn`

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn build-prod`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn electron:start`

Builds and runs the desktop app using electron. The process depends on `concurrently` and `wait-on` to know when to launch the electron instance. If the app fails to launch after `yarn start`, you can simply run `electron .` to run the electron app.

---

Copyright (C) Right to Privacy Foundation
