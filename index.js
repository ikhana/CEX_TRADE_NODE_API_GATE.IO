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

    const amount = 30; // Adjust amount as needed
    const buyOrder = await createOrder(currencyPair, "buy", amount, middlePrice);
    const sellPrice = middlePrice + 0.00001; // Adjust the price difference as needed
    const sellOrder = await createOrder(currencyPair, "sell", amount, sellPrice);

  
    console.log(`Limit sell order placed: ${sellOrder}`);

    await new Promise(resolve => setTimeout(resolve, 7000)); // Wait for 7 seconds

    await cancelOrders(currencyPair, "buy"); // Cancel buy orders
    await cancelOrders(currencyPair, "sell"); // Cancel sell orders

    console.log(`Buy order ${buyOrder} canceled`);
    console.log(`Sell order ${sellOrder} canceled`);

    await new Promise(resolve => setTimeout(resolve, 7000)); // Wait for 7 seconds

    flashOrders(); // Repeat the process
  } catch (error) {
    console.error("Error in flashOrders:", error);
  }
};

const getOrderBook = async () => {
  const opts = {
    interval: '0',
    limit: 20,
    withId: true
  };

  try {
    const orderBook = await api.listOrderBook(currencyPair, opts);
    return orderBook.body;
  } catch (error) {
    console.error("Error in getOrderBook:", error);
    throw error;
  }
};

const createOrder = async (currencyPair, side, amount, price) => {
  try {
    const orderOptions = {
      currency_pair: currencyPair,
      side: side,
      amount: amount.toString(),
      price: price.toString(),
      type: 'limit',
      account: 'spot'
    };



    let order;
    try {
      order = new GateApi.Order(orderOptions);
    } catch (error) {
      console.error('Error creating Order object:', error);
      return null;
    }

    if (order === null) {
      console.error('Order constructor returned null');
      return null;
    }

    if (Object.keys(order).length === 0) {
      console.error('Order constructor returned an empty object:', order);
      return null;
    }

    console.log('Order object:', order);

    const newOrder = await api.createOrder(order);
    console.log("Order creation response:", newOrder.body);
    return newOrder.body;
  } catch (error) {
    console.error("Error creating order:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const cancelOrders = async (currencyPair, side) => {
  const opts = {
    side: side,
    account: "spot" // Cancel orders from the spot account
  };

  try {
    const cancelledOrders = await api.cancelOrders(currencyPair, opts);
    console.log(`Orders canceled for ${side}:`, cancelledOrders.body);
    return cancelledOrders.body;
  } catch (error) {
    console.error(`Error canceling orders for ${side}:`, error.response ? error.response.data : error.message);
    throw error;
  }
};

flashOrders();
