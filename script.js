
const lista = document.getElementById("listaItems");
const slots = { cabeza: null, pecho: null, piernas: null, arma1: null, arma2: null };
let dragIndex = null;

const charPhotoInput = document.getElementById("charPhotoInput");
const charPhoto = document.getElementById("charPhoto");

charPhotoInput.addEventListener("change", () => {
  const file = charPhotoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    charPhoto.src = e.target.result;
    localStorage.setItem("pj_foto", e.target.result);
  };
  reader.readAsDataURL(file);
});

function cargarFoto() {
  const foto = localStorage.getItem("pj_foto");
  if (foto) {
    charPhoto.src = foto;
  }
}


const charName = document.getElementById("charName");
const charDeath = document.getElementById("charDeath");
const charXP = document.getElementById("charXP");


function guardarPersonaje() {
  localStorage.setItem("pj_name", charName.value);
  localStorage.setItem("pj_death", charDeath.value);
  localStorage.setItem("pj_xp", charXP.value);

}

function cargarPersonaje() {
  charName.value = localStorage.getItem("pj_name") || "";
  charDeath.value = localStorage.getItem("pj_death") || "";
  charXP.value = localStorage.getItem("pj_xp") || "";

}

const items = [];

function emojiPorTipo(tipo) {
  return {
    cabeza: "🪖",
    pecho: "🦺",
    piernas: "👖",
    arma: "⚔️",
    objeto: "🧪"
  }[tipo] || "❔";
}

function agregarItem() {
  const nombre = document.getElementById("itemName").value.trim();
  const tipo = document.getElementById("itemType").value;
  const cantidad = parseInt(document.getElementById("itemQty").value);
  const iconInput = document.getElementById("itemIcon");
  const archivo = iconInput.files[0];

  if (!nombre || cantidad <= 0) return;

  const agregar = (icon) => {
    items.push({ nombre, tipo, cantidad, icon });
    actualizarLista();
    actualizarSlots();
    guardarTodo();
  };

  if (archivo) {
    const reader = new FileReader();
    reader.onload = e => agregar(e.target.result);
    reader.readAsDataURL(archivo);
  } else {
    agregar(null);
  }

  document.getElementById("itemName").value = "";
  document.getElementById("itemQty").value = 1;
  iconInput.value = "";
}

function actualizarLista() {
  lista.innerHTML = "";
  items.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "inventory-slot";
    div.draggable = true;

    div.ondragstart = () => dragIndex = i;
    div.ondragover = e => e.preventDefault();
    div.ondrop = () => {
      if (typeof dragIndex === "number" && dragIndex !== i) {
        [items[i], items[dragIndex]] = [items[dragIndex], items[i]];
        actualizarLista();
        guardarTodo();
      }
    };

    div.onclick = (e) => {
      e.stopPropagation();
      const rect = div.getBoundingClientRect();
      mostrarPopup(rect.right + 10, rect.top, i);
    };

    const content = document.createElement(item.icon ? "img" : "div");
    if (item.icon) {
      content.src = item.icon;
    } else {
      content.textContent = emojiPorTipo(item.tipo);
      content.style.fontSize = "28px";
      content.style.textAlign = "center";
      content.style.lineHeight = "64px";
    }
    div.appendChild(content);

    const qty = document.createElement("div");
    qty.className = "qty";
    qty.textContent = item.cantidad;
    div.appendChild(qty);
  // Si es un objeto usable, mostrar botón



    lista.appendChild(div);
  });
}


let popup = null;
function mostrarPopup(x, y, index) {
  cerrarPopup();

  const item = items[index];
  popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.left = x + "px";
  popup.style.top = y + "px";
  popup.style.background = "#fff";
  popup.style.border = "2px solid #444";
  popup.style.borderRadius = "6px";
  popup.style.padding = "10px";
  popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
  popup.style.zIndex = 1000;

  if (item.tipo === "objeto") {
    const usarBtn = document.createElement("button");
    usarBtn.textContent = "🧪 Usar";
    usarBtn.onclick = () => {
      usarObjeto(item);
      item.cantidad--;
      if (item.cantidad <= 0) items.splice(index, 1);
      cerrarPopup();
      actualizarLista();
      guardarTodo();
    };
    popup.appendChild(usarBtn);
  }

  const eliminarBtn = document.createElement("button");
  eliminarBtn.textContent = "❌ Eliminar";
  eliminarBtn.style.marginTop = "5px";
  eliminarBtn.onclick = () => {
    items.splice(index, 1);
    cerrarPopup();
    actualizarLista();
    guardarTodo();
  };
  popup.appendChild(eliminarBtn);

  const cancelarBtn = document.createElement("button");
  cancelarBtn.textContent = "🔄 Cancelar";
  cancelarBtn.style.marginTop = "5px";
  cancelarBtn.onclick = cerrarPopup;
  popup.appendChild(cancelarBtn);

  document.body.appendChild(popup);
}

function cerrarPopup() {
  if (popup) {
    popup.remove();
    popup = null;
  }
}

document.addEventListener("click", (e) => {
  if (popup && !popup.contains(e.target)) {
    cerrarPopup();
  }
});


function usarObjeto(item) {
  alert(`${item.nombre} usado. Recuperas 1 punto de salud.`);

  const saludChecks = document.getElementById("charHealth").querySelectorAll("input");
  for (let i = 0; i < saludChecks.length; i++) {
    if (!saludChecks[i].checked) {
      saludChecks[i].checked = true;
      break;
    }
  }

  const values = Array.from(saludChecks).map(cb => cb.checked);
  localStorage.setItem("pj_salud", JSON.stringify(values));
}

function equiparItem(index) {
  const item = items[index];
  const { tipo, nombre, icon } = item;
  if (["cabeza", "pecho", "piernas"].includes(tipo)) {
    if (slots[tipo]) items.push({ ...slots[tipo], tipo });
    slots[tipo] = { nombre, icon };
    items.splice(index, 1);
  } else if (tipo === "arma") {
    const slot = !slots.arma1 ? "arma1" : (!slots.arma2 ? "arma2" : null);
    if (!slot) return alert("Ambas manos están ocupadas.");
    slots[slot] = { nombre, icon };
    items.splice(index, 1);
  } else {
    usarObjeto(item);
    item.cantidad--;
    if (item.cantidad <= 0) items.splice(index, 1);
  }
  actualizarLista();
  actualizarSlots();
  guardarTodo();
}

function actualizarSlots() {
  ["cabeza", "pecho", "piernas", "arma1", "arma2"].forEach(id => {
    const el = document.getElementById("slot-" + id);
    const span = el.querySelector("span");
    const data = slots[id];

    el.ondragover = e => e.preventDefault();
    el.ondrop = () => {
      if (typeof dragIndex !== "number") return;
      const item = items[dragIndex];
      const tipoEsperado = id.includes("arma") ? "arma" : id;
      if (item.tipo !== tipoEsperado) return alert("No se puede equipar en este slot");
      if (slots[id]) items.push({ ...slots[id], tipo: tipoEsperado });
      slots[id] = { nombre: item.nombre, icon: item.icon };
      items.splice(dragIndex, 1);
      dragIndex = null;
      actualizarLista();
      actualizarSlots();
      guardarTodo();
    };

    el.onclick = () => {
      if (slots[id]) {
        const tipo = id.includes("arma") ? "arma" : id;
        items.push({ nombre: slots[id].nombre, icon: slots[id].icon, tipo, cantidad: 1 });
        slots[id] = null;
        actualizarLista();
        actualizarSlots();
        guardarTodo();
      }
    };

    if (data) {
      if (data.icon) {
        span.innerHTML = `<img src="${data.icon}" style="width:24px; vertical-align:middle; margin-right:5px;" /> ${data.nombre}`;
      } else {
        span.textContent = emojiPorTipo(id.includes("arma") ? "arma" : id) + " " + data.nombre;
      }
    } else {
      span.textContent = "-";
    }
  });
}

function guardarTodo() {
  localStorage.setItem("inventario_items", JSON.stringify(items));
  localStorage.setItem("inventario_slots", JSON.stringify(slots));
}


function crearChecks(container, estados, key) {
  container.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = estados[i] || false;
    cb.addEventListener("change", () => {
      const values = Array.from(container.querySelectorAll("input")).map(cb => cb.checked);
      localStorage.setItem(key, JSON.stringify(values));
    });
    container.appendChild(cb);
  }
}


function cargarTodo() {
  const savedItems = JSON.parse(localStorage.getItem("inventario_items") || "[]");
  const savedSlots = JSON.parse(localStorage.getItem("inventario_slots") || "{}");
  items.splice(0, items.length, ...savedItems);
  Object.assign(slots, savedSlots);
  actualizarLista();
  actualizarSlots();
}

window.addEventListener("DOMContentLoaded", () => {
  cargarTodo();
  cargarPersonaje();
  cargarFoto();
  
  crearChecks(document.getElementById("charHealth"), JSON.parse(localStorage.getItem("pj_salud") || "[]"), "pj_salud");
  crearChecks(document.getElementById("charEnergy"), JSON.parse(localStorage.getItem("pj_energia") || "[]"), "pj_energia");

  charName.addEventListener('input', guardarPersonaje);
  charDeath.addEventListener('input', guardarPersonaje);
  charXP.addEventListener('input', guardarPersonaje);

});


let contadorNotas = 0;
const sonidoEliminar = new Audio("data:audio/mp3;base64,SUQzAwAAAAAAf1RTU0UAAAAPAAADTGF2ZjU2LjI0LjEwNAAAAAAAAAAAAAAA//tQxAADBzYATDUAADUgAADUgAA==");

const papelera = document.createElement("div");
papelera.id = "papelera-notas";
papelera.textContent = "🗑️ Papelera";
papelera.style.position = "fixed";
papelera.style.bottom = "20px";
papelera.style.right = "20px";
papelera.style.background = "#440000cc";
papelera.style.color = "white";
papelera.style.padding = "10px 16px";
papelera.style.border = "2px solid #900";
papelera.style.borderRadius = "8px";
papelera.style.zIndex = "10000";
papelera.style.display = "none";
papelera.style.fontWeight = "bold";
document.body.appendChild(papelera);

papelera.addEventListener("dragover", e => e.preventDefault());
papelera.addEventListener("drop", e => {
  const dragging = document.querySelector(".dragging-nota");
  if (dragging) {
    sonidoEliminar.play();
    dragging.remove();
    guardarNotas();
    papelera.style.display = "none";
  }
});

function crearNota(contenido = "", x = 100, y = 100) {
  const nota = document.createElement("div");
  nota.className = "postit";
  nota.style.left = x + "px";
  nota.style.top = y + "px";
  nota.style.resize = "both";
  nota.style.overflow = "auto";
  nota.setAttribute("data-id", contadorNotas++);

  const manija = document.createElement("div");
  manija.className = "nota-manija";
  manija.textContent = "↕️";

  const btnMin = document.createElement("button");
  btnMin.textContent = "🗕";
  btnMin.onclick = (e) => {
    e.stopPropagation();
    const contenido = nota.querySelector(".nota-contenido");
    const imagenes = nota.querySelectorAll("img");
    const clip = nota.querySelector(".btn-imagen");
    const oculto = contenido.style.display === "none";
    contenido.style.display = oculto ? "block" : "none";
    imagenes.forEach(img => img.style.display = oculto ? "block" : "none");
    if (clip) clip.style.display = oculto ? "inline-block" : "none";
  };
  manija.appendChild(btnMin);

  const btnClip = document.createElement("button");
  btnClip.textContent = "📎";
  btnClip.className = "btn-imagen";
  btnClip.title = "Agregar imagen";
  btnClip.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.maxWidth = "100%";
        img.style.marginTop = "6px";
        nota.appendChild(img);
        guardarNotas();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };
  manija.appendChild(btnClip);

  nota.appendChild(manija);

  const contenidoDiv = document.createElement("div");
  contenidoDiv.className = "nota-contenido";
  contenidoDiv.contentEditable = true;
  contenidoDiv.innerHTML = contenido;
  nota.appendChild(contenidoDiv);

  nota.setAttribute("draggable", "true");
  nota.addEventListener("dragstart", () => {
    nota.classList.add("dragging-nota");
    papelera.style.display = "block";
  });
  nota.addEventListener("dragend", () => {
    nota.classList.remove("dragging-nota");
    papelera.style.display = "none";
  });

  document.body.appendChild(nota);
  hacerDraggable(nota);
  guardarNotas();
}

function hacerDraggable(el) {
  const manija = el.querySelector(".nota-manija");
  let offsetX, offsetY;
  manija.style.cursor = "move";
  manija.addEventListener("mousedown", e => {
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    function mover(e) {
      el.style.left = (e.clientX - offsetX) + "px";
      el.style.top = (e.clientY - offsetY) + "px";
    }
    function soltar() {
      document.removeEventListener("mousemove", mover);
      document.removeEventListener("mouseup", soltar);
      guardarNotas();
    }
    document.addEventListener("mousemove", mover);
    document.addEventListener("mouseup", soltar);
  });
}

function guardarNotas() {
  const notas = Array.from(document.querySelectorAll(".postit")).map(nota => {
    const contenido = nota.querySelector(".nota-contenido")?.innerHTML || "";
    const imagenes = Array.from(nota.querySelectorAll("img")).map(img => img.src);
    return {
      contenido,
      imagenes,
      x: parseInt(nota.style.left),
      y: parseInt(nota.style.top)
    };
  });
  localStorage.setItem("notas_jugador", JSON.stringify(notas));
}

function cargarNotas() {
  const saved = JSON.parse(localStorage.getItem("notas_jugador") || "[]");
  saved.forEach(n => {
    const nota = crearNota(n.contenido, n.x, n.y);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  cargarNotas();
});
