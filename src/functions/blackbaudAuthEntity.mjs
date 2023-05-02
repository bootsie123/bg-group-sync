import * as df from "durable-functions";

df.app.entity("blackbaudAuthEntity", {
  handler: (context) => {
    let currentTicket = context.df.getState(() => {});

    switch (context.df.operationName) {
      case "set": {
        currentTicket = context.df.getInput();

        break;
      }
      case "get": {
        context.df.return(currentTicket);

        break;
      }
    }

    context.df.setState(currentTicket);
  }
});
