const STORAGE_KEY = "datalogger_data";
const FIELDS_KEY = "datalogger_fields";

let fields = JSON.parse(localStorage.getItem(FIELDS_KEY) || "[]");

document.addEventListener("DOMContentLoaded", () => {
  renderFields();
  loadData();

  document.getElementById("addFieldBtn").addEventListener("click", addField);
  document.getElementById("dataForm").addEventListener("submit", saveFormData);
  document.getElementById("exportBtn").addEventListener("click", exportCsv);
  document.getElementById("clearBtn").addEventListener("click", clearData);

  startQrScanner();
});

function addField() {
  const input = document.getElementById("newFieldName");
  const name = input.value.trim();
  if (name && !fields.includes(name)) {
    fields.push(name);
    localStorage.setItem(FIELDS_KEY, JSON.stringify(fields));
    renderFields();
    input.value = "";
  }
}

function renderFields() {
  const container = document.getElementById("formFields");
  container.innerHTML = "";
  fields.forEach(field => {
    const label = document.createElement("label");
    label.textContent = field + ": ";
    const input = document.createElement("input");
    input.type = "text";
    input.name = field;
    container.appendChild(label);
    container.appendChild(input);
    container.appendChild(document.createElement("br"));
  });
  renderTableHeader();
}

function saveFormData(event) {
  event.preventDefault();
  const formData = {};
  fields.forEach(f => {
    formData[f] = document.querySelector(`[name="${f}"]`).value.trim();
  });
  const arr = getData();
  arr.push({ ts: Date.now(), type: "FORM", values: formData });
  saveData(arr);
  event.target.reset();
}

function getData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveData(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  renderList(arr);
}

function renderTableHeader() {
  const header = document.getElementById("tableHeader");
  header.innerHTML = "<th>#</th><th>Dátum</th><th>Típus</th>";
  fields.forEach(f => {
    const th = document.createElement("th");
    th.textContent = f;
    header.appendChild(th);
  });
}

function renderList(arr) {
  const body = document.getElementById("tableBody");
  body.innerHTML = "";
  arr.forEach((item, idx) => {
    const tr = document.createElement("tr");
    const date = new Date(item.ts).toLocaleString();
    tr.innerHTML = `<td>${idx+1}</td><td>${date}</td><td>${item.type}</td>`;
    fields.forEach(f => {
      const td = document.createElement("td");
      td.textContent = item.values?.[f] || "";
      tr.appendChild(td);
    });
    body.appendChild(tr);
  });
}

function loadData() { saveData(getData()); }

function clearData() {
  if (confirm("Biztos törölni akarod az összes adatot?")) {
    saveData([]);
  }
}

function exportCsv() {
  const arr = getData();
  if (arr.length === 0) return alert("Nincs exportálható adat");
  let csv = "id,timestamp,type," + fields.join(",") + "\n";
  arr.forEach((item, i) => {
    const row = [i+1, item.ts, item.type];
    fields.forEach(f => row.push(`"${item.values?.[f] || ""}"`));
    csv += row.join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `datalog_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function startQrScanner() {
  const html5QrCode = new Html5Qrcode("qr-reader");
  const config = { fps: 10, qrbox: 250 };
  html5QrCode.start(
    { facingMode: "environment" },
    config,
    qrCodeMessage => {
      const arr = getData();
      arr.push({
        ts: Date.now(),
        type: "QR",
        values: { QR: qrCodeMessage }
      });
      saveData(arr);
    },
    errorMessage => {
      console.log("QR error", errorMessage);
    }
  ).catch(err => console.error("QR init error", err));
}
