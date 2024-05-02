# Tic-Tac-Toe

This an implementation of Tic Tac Toe as a managed component. It is composed of the following building bricks:
* `tic-tac-toe-worker`: A worker whose responsibility is to compute the computer move, as well as possibilities for player moves
* `component-manager`: A local environment to run the managed component
* `component-manager/components/tic-tac-toe-mc`: The main managed component 

The worker is already published at https://tic-tac-toe-worker.jestin-17.workers.dev.

## How to run in local

This will build the managed component, then run WebCM to have it running:
```
npm install
npm run dev
```

You can then visit htt://localhost:1337 to see the component.

## How to deploy the worker

```
npx wrangler deploy
```

## Things to improve

At the moment the quality of the code is minimal. To make it production ready, we should:
* Review component permissions.
* Get rid of `client.execute` calls if possible.
* Categorize code into seperate files/folders to make it cleaner.
* I have spotted a couple of bugs in the logic, however they are hard to reproduce due to the random nature of the computer player.
* Write unit tests for both the worker and the managed component.
