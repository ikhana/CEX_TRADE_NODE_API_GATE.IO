require("dotenv").config();
const GateApi = require('gate-api');
const client = new GateApi.ApiClient();
client.setApiKeySecret(process.env.GATE_KEY, process.env.GATE_SECRET);

const api = new GateApi.SpotApi(client);
const currencyPair = "DARK_USDT";

const flashOrders = async () => {
  try {
    const orderBook = await getOrderBook();
    const bids = orderBook.bids;
    const asks = orderBook.asks;

    const highestBid = parseFloat(bids[0][0]);
    const lowestAsk = parseFloat(asks[0][0]);
    const spread = lowestAsk - highestBid;
    const lastPrice = parseFloat(orderBook.last);

    console.log(`Spread: ${spread}`);
    console.log(`Last price: ${lastPrice}`);

    const middlePrice = (highestBid + lowestAsk) / 2;
    console.log(`Middle price: ${middlePrice}`);

    const amount = 0.1; // Adjust amount as needed
    const buyOrder = await createOrder(currencyPair, "buy", amount, middlePrice);
    const sellPrice = middlePrice + 0.00001; // Adjust the price difference as needed
    const sellOrder = await createOrder(currencyPair, "sell", amount, sellPrice);

    console.log(`Limit buy order placed: ${buyOrder.id}`);
    console.log(`Limit sell order placed: ${sellOrder.id}`);

    await new Promise(resolve => setTimeout(resolve, 7000)); // Wait for 7 seconds

    await cancelOrders(currencyPair, "buy"); // Cancel buy orders
    await cancelOrders(currencyPair, "sell"); // Cancel sell orders

    console.log(`Buy order ${buyOrder.id} canceled`);
    console.log(`Sell order ${sellOrder.id} canceled`);

    await new Promise(resolve => setTimeout(resolve, 7000)); // Wait for 7 seconds

    flashOrders(); // Repeat the process
  } catch (error) {
    console.error(error);
  }
};

const getOrderBook = async () => {
  const opts = {
    interval: '0',
    limit: 20,
    withId: true
  };

  const orderBook = await api.listOrderBook(currencyPair, opts);
  return orderBook.body;
};

const createOrder = async (currencyPair, side, amount, price) => {
  const order = {
    currency_pair: currencyPair,
    side: side,
    amount: amount,
    price: price,
    account: "spot" // Use the spot account
  };

  const newOrder = await api.createOrder(order);
  return newOrder.body;
};

const cancelOrders = async (currencyPair, side) => {
  const opts = {
    side: side,
    account: "spot" // Cancel orders from the spot account
  };

  const cancelledOrders = await api.cancelOrders(currencyPair, opts);
  return cancelledOrders.body;
};

flashOrders();