const groups = {
  pizzas: [
    ["margherita", "Маргарита", "Томатный соус, моцарелла и свежий базилик.", 510, 9, "500 г", "pizza"],
    ["seafood", "С морепродуктами", "Морепродукты, томатный соус, моцарелла и зелень.", 680, 9, "550 г", "seafood"],
    ["pepperoni", "Пепперони с красным луком", "Пикантная пепперони, красный лук, томатный соус и сыр.", 630, 9, "500 г", "pepperoni"],
    ["four-cheese", "4 сыра", "Моцарелла, горгонзола, пармезан и сливочный сыр.", 610, 9, "500 г", "cheese"],
  ],
  focaccia: [
    ["focaccia-rosemary", "Фокачча с розмарином", "Тёплая итальянская лепёшка с оливковым маслом и розмарином.", 250, 9, "150 г", "focaccia"],
    ["focaccia-parmesan", "Фокачча с пармезаном", "Хрустящая фокачча с пармезаном и оливковым маслом.", 270, 9, "150 г", "focaccia"],
  ],
  lemonades: [
    "Классический", "Огуречный", "Клубничный", "Малиновый", "Цитрусовый микс", "Имбирно-лимонный", "Арбузный"
  ].map((n, i) => ["lemonade-" + i, n, "Освежающий домашний лимонад.", 450, 5, "0,5 л", "lemonade"]),
};

const colors = {
  pizza: "#d86b42",
  seafood: "#7398a4",
  pepperoni: "#b94e3d",
  cheese: "#d8a84d",
  focaccia: "#c89455",
  lemonade: "#79a89b",
},
cart = new Map(),
money = (v) => new Intl.NumberFormat("ru-RU").format(v) + " ₽";

function art(kind) {
  const c = colors[kind] || colors.pizza;
  return (
    '<svg viewBox="0 0 120 120" role="img" aria-label="Иллюстрация блюда" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" fill="#edf1f5"/><circle cx="60" cy="60" r="43" fill="#fff"/><circle cx="60" cy="60" r="37" fill="' + c + '"/><path d="M30 45Q60 30 90 45L85 70Q60 84 35 70Z" fill="#e8c16b" opacity=".9"/><circle cx="48" cy="52" r="5" fill="#b94e3d"/><circle cx="70" cy="64" r="5" fill="#b94e3d"/><circle cx="64" cy="45" r="4" fill="#fff" opacity=".8"/><path d="M42 69Q60 78 78 66" fill="none" stroke="#5d833f" stroke-width="4"/></svg>'
  );
}

// Путь к папке с фотографиями относительно pages/index.html
const ASSETS_PATH = "assets/";

// Сопоставление: id блюда -> имя файла в assets.
// Если файла нет, скрипт покажет SVG-заглушку (см. обработчик onerror ниже).
const photoFiles = {
  "margherita": "margherita.jpg",
  "seafood": "seafood.jpg",
  "pepperoni": "pepperoni.jpg",
  "four-cheese": "four-cheese.jpg",
  "focaccia-rosemary": "focaccia-rosemary.jpg",
  "focaccia-parmesan": "focaccia-parmesan.jpg",
  "lemonade-0": "lemonade-0.jpg",
  "lemonade-1": "lemonade-1.jpg",
  "lemonade-2": "lemonade-2.jpg",
  "lemonade-3": "lemonade-3.jpg",
  "lemonade-4": "lemonade-4.jpg",
  "lemonade-5": "lemonade-5.jpg",
  "lemonade-6": "lemonade-6.jpg",
};

function makeItem(a, station) {
  const [id, name, desc, price, time, size, kind] = a,
    el = document.createElement("article");
  el.className = "dish";
  el.dataset.id = id;
  el.dataset.name = name;
  el.dataset.price = price;
  el.dataset.time = time;
  el.dataset.station = station;

  // Фото блюда: если файла нет в assets — подставляем SVG-заглушку
  const figure = document.createElement("figure");
  figure.className = "dish-photo";
  const file = photoFiles[id];
  if (file) {
    const img = document.createElement("img");
    img.src = ASSETS_PATH + file;
    img.alt = name;
    img.loading = "lazy";
    img.addEventListener("error", () => {
      // Файл не найден — показываем заглушку
      figure.innerHTML = art(kind);
    });
    figure.appendChild(img);
  } else {
    figure.innerHTML = art(kind);
  }

  el.appendChild(figure);

  const text = document.createElement("div");
  text.innerHTML = '<h4></h4><p></p><div class="dish-meta"><strong></strong><span></span></div>';
  text.querySelector("h4").textContent = name;
  text.querySelector("p").textContent = desc;
  text.querySelector("strong").textContent = money(price);
  text.querySelector("span").textContent = "~ " + time + " мин · " + size;
  el.appendChild(text);

  const btn = document.createElement("button");
  btn.className = "add-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Добавить " + name);
  btn.textContent = "+";
  btn.addEventListener("click", () => change(el, 1));
  el.appendChild(btn);

  return el;
}

for (const [id, items] of Object.entries(groups)) {
  const box = document.getElementById(id);
  items.forEach((a) => box.appendChild(makeItem(a, a[6])));
}

const cartEl = document.getElementById("cart"),
  countEl = document.getElementById("item-count"),
  subtotalEl = document.getElementById("subtotal"),
  totalEl = document.getElementById("total"),
  prepEl = document.getElementById("prep-time"),
  sendBtn = document.getElementById("send-order"),
  modal = document.getElementById("confirmation");

function change(el, amount) {
  const item = cart.get(el.dataset.id) || {
    id: el.dataset.id,
    name: el.dataset.name,
    price: +el.dataset.price,
    time: +el.dataset.time,
    station: el.dataset.station,
    qty: 0,
  };
  item.qty += amount;
  if (item.qty < 1) cart.delete(item.id);
  else cart.set(item.id, item);
  render();
}

function prepTime() {
  if (!cart.size) return null;
  const stations = new Map();
  cart.forEach((i) => {
    const batches = Math.ceil(i.qty / 5),
      itemTime = i.time + (batches - 1) * 3;
    stations.set(i.station, Math.max(stations.get(i.station) || 0, itemTime));
  });
  return Math.max(...stations.values());
}

function render() {
  cartEl.innerHTML = "";
  let qty = 0,
    sum = 0;
  if (!cart.size)
    cartEl.innerHTML = '<p class="empty">Пока здесь пусто.<br>Добавьте блюдо из меню.</p>';
  cart.forEach((i) => {
    qty += i.qty;
    sum += i.price * i.qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML =
      '<div><strong></strong><small></small></div><div class="quantity"><button type="button">−</button><span></span><button type="button">+</button></div>';
    row.querySelector("strong").textContent = i.name;
    row.querySelector("small").textContent = money(i.price * i.qty);
    row.querySelector("span").textContent = i.qty;
    row
      .querySelectorAll("button")[0]
      .addEventListener("click", () =>
        change(document.querySelector('[data-id="' + i.id + '"]'), -1),
      );
    row
      .querySelectorAll("button")[1]
      .addEventListener("click", () =>
        change(document.querySelector('[data-id="' + i.id + '"]'), 1),
      );
    cartEl.appendChild(row);
  });
  countEl.textContent = qty + " " + (qty === 1 ? "позиция" : qty < 5 ? "позиции" : "позиций");
  subtotalEl.textContent = money(sum);
  totalEl.textContent = money(sum);
  sendBtn.disabled = !cart.size;
  const time = prepTime();
  prepEl.textContent = time
    ? "Приготовим примерно за " + time + " мин"
    : "Время появится здесь";
}

sendBtn.addEventListener("click", () => {
  const table = document.getElementById("table-number").value;
  document.getElementById("confirmation-text").textContent =
    table >= 1 && table <= 20
      ? "Заказ для столика №" +
        table +
        " принят. Когда всё будет готово, мы принесём его прямо к вам."
      : "Укажите номер столика от 1 до 20, чтобы мы знали, куда принести заказ.";
  if (table >= 1 && table <= 20) {
    const list = document.getElementById("ordered-list");
    cart.forEach((i) => {
      const row = document.createElement("div");
      row.className = "ordered-item";
      row.innerHTML = "<div><strong></strong><small></small></div><span></span>";
      row.querySelector("strong").textContent = i.name;
      row.querySelector("small").textContent = "Количество: " + i.qty;
      row.querySelector("span").textContent = money(i.price * i.qty);
      list.appendChild(row);
    });
    document.getElementById("ordered").classList.add("visible");
    cart.clear();
    render();
  }
  modal.hidden = false;
  document.getElementById("close-confirmation").focus();
});

document
  .getElementById("close-confirmation")
  .addEventListener("click", () => (modal.hidden = true));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.hidden = true;
});
render();
