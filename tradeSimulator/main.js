import BozoECS from "../BozoECS.js";
import { random } from "../helper.js";

const portfolio = BozoECS.createComponent("inventory", {
  items: [],
  credits: 1000
})

const item = BozoECS.createComponent("item", {
  price: 0,
  name: "n/a",
  type: "n/a",
  owner: -1,
  amount: 1
})

const storage = BozoECS.createComponent("storage", {
  items: []
})

let market = BozoECS.createEntity();

BozoECS.addComponents(market, [storage]);

let [marketStore] = BozoECS.getComponents(market, [storage]);

let trader = BozoECS.createEntity();

BozoECS.addComponents(trader, [portfolio]);

let traders = new Array(4);

for (let i = 0; i < traders.length; i++) {
  traders[i] = BozoECS.instantiate(trader);
}

let player = traders[parseInt(random(0, traders.length - 1))];
let [playerAssets] = BozoECS.getComponents(player, [portfolio]);

let controls = document.createElement("div");

let updateMarketView = document.createElement("button");
updateMarketView.onclick = () => displayMarket(marketStore);
updateMarketView.innerText = "update market view";

controls.appendChild(updateMarketView);

document.body.appendChild(controls);

let info = document.createElement("div");
let wallet = document.createElement("div");
wallet.innerText = "balance ($): ";
let balance = document.createElement("span");
let userId = document.createElement("div");
userId.innerHTML = `user ID: ${player.id}`;
wallet.appendChild(balance);
info.appendChild(wallet);
info.appendChild(userId);

let displayContainer = document.createElement("div");
displayContainer.style.height = "600px";
displayContainer.style.width = "100%";
displayContainer.style.border = "1px solid black";
displayContainer.style.display = "flex";

let portfolioViewCell = document.createElement("div");
portfolioViewCell.style.border = "1px solid green";
portfolioViewCell.style.overflow = "scroll";
portfolioViewCell.style.flex = 1 

let marketViewCell = document.createElement("div");
marketViewCell.style.border = "1px solid red";
marketViewCell.style.overflow = "scroll";
marketViewCell.style.flex = 1;

displayContainer.appendChild(portfolioViewCell);
displayContainer.appendChild(marketViewCell);

document.body.appendChild(displayContainer);

let portfolioView = document.createElement("table");
portfolioView.style.width = "100%";
portfolioViewCell.appendChild(info);
portfolioViewCell.appendChild(portfolioView);

let marketView = document.createElement("table");
marketView.style.width = "100%";
marketViewCell.appendChild(marketView);

setInterval(()=>displayMarket(marketStore), 10000);
displayPortfolio(playerAssets);

const itemTypes = [
  "food",
  "grocery",
  "furniture",
  "entertainment",
  "electronics",
  "art",
  ]
  
setInterval(() => {
  marketStore.items.push(createItem("generic", random(10, 50).toFixed(2), parseInt(random(10, 100)), itemTypes[parseInt(random(0, itemTypes.length - 1))], parseInt(random(traders.length, 10000))))
}, 1000)

function createItem(name, price, amount, type, ownerId) {
  let product = BozoECS.copyComponent(item);
  product.properties.name = name;
  product.properties.price = price;
  product.properties.ownerId = ownerId;
  product.properties.amount = amount
  product.properties.type = type;
  return product;
}

function buyItems(item, amount, buyer) {
  if (item.properties.amount < amount) return console.log("not enough stock");
  let [buyerAssets] = BozoECS.getComponents(buyer, [portfolio]);
  if (item.properties.price * amount > buyerAssets.credits) return console.log("not enough money");
  item.properties.amount -= amount;
  if (item.properties.ownerId != buyer.id) buyerAssets.credits -= item.properties.price * amount;
  let product = createItem(item.properties.name, item.properties.price, amount, item.properties.type, buyer.id);
  console.log(`buying ${amount} units of ${item.properties.name} for $${item.properties.price} each`);
  buyerAssets.items.push(product);
}

function sellItems(item, amount, marketStore) {
  if (item.properties.amount < amount) return console.log("not enough stock");
  console.log(`selling ${amount} units of ${item.properties.name} to market`);
  item.properties.amount -= amount;
  let product = createItem(item.properties.name, item.properties.price, amount, item.properties.type, item.properties.ownerId);
  marketStore.items.push(product);
}

function makeRow() {
  return [document.createElement("tr"), document.createElement("td")];
}

function makeButton() {
  return document.createElement("button");
}

function makeInput(name, type) {
  let input = document.createElement("input");
  input.type = type;
  input.placeholder = name;
  return input;
}

function getDetails(item) {
  return `item name: ${item.properties.name}\nprice per unit ($): ${item.properties.price}\nitem type: ${item.properties.type}\nitem stock: ${item.properties.amount}\nowner ID: ${item.properties.ownerId}`;
}

function displayMarket(marketStore) {
  marketView.innerHTML = "";
  for (let i = 0; i < marketStore.items.length; i++) {
    let [row, data] = makeRow();
    let amount = makeInput("amount", "number");
    let buy = makeButton();
    buy.innerText = "buy product";
    buy.onclick = () => {
      buyItems(marketStore.items[i], parseInt(amount.value), player);
      if (marketStore.items[i].properties.amount <= 0) {
        buy.disabled = true;
        buy.innerText = "sold out";
        marketStore.items.splice(i, 1);
      }
      displayPortfolio(playerAssets);
    }
    data.innerText = getDetails(marketStore.items[i]);
    data.appendChild(amount);
    data.appendChild(buy);
    row.appendChild(data);
    row.style.background = "lightgrey";
    marketView.appendChild(row);
  }
}

function displayPortfolio(portfolio) {
  balance.innerText = portfolio.credits;
  portfolioView.innerHTML = "";
  for (let i = 0; i < portfolio.items.length; i++) {
    let [row, data] = makeRow();
    let amount = makeInput("amount", "number");
    let sell = makeButton();
    sell.innerText = "sell product";
    sell.onclick = () => {
      sellItems(portfolio.items[i], parseInt(amount.value), marketStore);
      if (portfolio.items[i].properties.amount <= 0) {
        portfolio.items.splice(i, 1);
      }
      displayPortfolio(portfolio);
    }
    data.innerText = getDetails(portfolio.items[i]);
    data.appendChild(amount);
    data.appendChild(sell);
    row.appendChild(data);
    row.style.background = "lightgrey";
    portfolioView.appendChild(row);
  }
}