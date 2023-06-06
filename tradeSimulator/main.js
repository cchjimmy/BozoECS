import BozoECS from "../BozoECS.js";

const inventory = BozoECS.createComponent("inventory", {
  items: [],
  wallet: 1000
})

const item = BozoECS.createComponent("item", {
  price: 0,
  name: "n/a",
  type: "n/a"
})

let baseEntity = BozoECS.createEntity();

BozoECS.addComponents(baseEntity, [inventory]);

let [invent] = BozoECS.getComponents(baseEntity, [inventory]);

let controls = document.createElement("div");

let name = document.createElement("input");
name.placeholder = "name";
name.type = 'text';

let price = document.createElement("input");
price.placeholder = "price";
price.type = "number";

let make = document.createElement("button");
make.innerText = "make product";
make.onclick = () => {
  console.log(`creating: ${name.value}`);
  let product = createItem(name.value, parseFloat(price.value));
  invent.items.push(product);
  invent.wallet -= product.properties.price;
  displayInventory(invent);
};

let market = [];

let updateMarketView = document.createElement("button");
updateMarketView.onclick = () => displayMarket(market);
updateMarketView.innerText = "update market view";

controls.appendChild(name);
controls.appendChild(price);
controls.appendChild(make);
controls.appendChild(updateMarketView);

document.body.appendChild(controls);

let info = document.createElement("div");
let wallet = document.createElement("div");
wallet.innerText = "balance ($): ";
let balance = document.createElement("span");
let userId = document.createElement("div");
userId.innerHTML = `user ID: ${baseEntity.id}`;
wallet.appendChild(balance);
info.appendChild(wallet);
info.appendChild(userId);
document.body.appendChild(info);

let displayContainer = document.createElement("div");
displayContainer.style.height = "600px";
displayContainer.style.width = "100%";
displayContainer.style.border = "1px solid black";
let marketViewCell = document.createElement("div");
marketViewCell.style.height = "50%";
marketViewCell.style.border = "1px solid red";
marketViewCell.style.overflow = "scroll";
let inventoryViewCell = document.createElement("div");
inventoryViewCell.style.height = "50%";
inventoryViewCell.style.border = "1px solid green";
inventoryViewCell.style.overflow = "scroll";
displayContainer.appendChild(inventoryViewCell);
displayContainer.appendChild(marketViewCell);

document.body.appendChild(displayContainer);

let inventoryView = document.createElement("table");
inventoryView.style.width = "100%";
inventoryViewCell.appendChild(inventoryView);

let marketView = document.createElement("table");
marketView.style.width = "100%";
marketViewCell.appendChild(marketView);

displayInventory(invent);
displayMarket(market);

function createItem(name, price) {
  let i = BozoECS.copyComponent(item);
  i.properties.name = name ?? i.properties.name;
  i.properties.price = price ?? i.properties.price;
  return i;
}

function displayMarket(market) {
  marketView.innerHTML = "";
  for (let i = 0; i < market.length; i++) {
    let item = document.createElement("tr");
    let data = document.createElement("td");
    let buy = document.createElement("button");
    buy.innerText = "buy product";
    buy.onclick = () => {
      console.log(`buying: ${market[i].properties.name}`);
      market.splice(i, 1);
      displayMarket(market);
    }
    data.innerText = `itemName: ${market[i].properties.name}\nitemPrice ($): ${market[i].properties.price}`;
    data.appendChild(buy);
    item.appendChild(data);
    marketView.appendChild(item);
  }
}

function displayInventory(inventory) {
  balance.innerText = inventory.wallet;
  inventoryView.innerHTML = "";
  for (let i = 0; i < inventory.items.length; i++) {
    let item = document.createElement("tr");
    let data = document.createElement("td");
    let sell = document.createElement("button");
    sell.innerText = "sell product";
    sell.onclick = () => {
      console.log(`selling: ${inventory.items[i].properties.name}`);
      market.push(inventory.items.splice(i, 1)[0]);
      displayInventory(inventory);
    }
    data.innerText = `itemName: ${inventory.items[i].properties.name}\nitemPrice ($): ${invent.items[i].properties.price}`;
    data.appendChild(sell);
    item.appendChild(data);
    inventoryView.appendChild(item);
  }
}