const log = (logger, source) => {
  return (type, ...args) => {
    if (source) {
      args = [`[${source}]`, ...args];
    }

    const message = args.join(" ");

    switch (type) {
      case "info": {
        logger.info(message);

        break;
      }
      case "warning": {
        logger.warn(message);

        break;
      }
      case "error": {
        logger.error(message);

        break;
      }
    }
  };
};

export default {
  createFromContext: (context, source) => {
    return log(context, source);
  },
  create: (source) => {
    return log(console, source);
  }
};
