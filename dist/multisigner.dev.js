(() => {
  // src/base.js
  var base_default = class {
    constructor(api_key) {
      if (!api_key)
        throw "Need an API KEY";
      this.api_key = api_key;
      this.format = "auto";
    }
    static modes = ["development", "staging", "production"];
    static bases = {
      staging: "https://staging.fa2s.com.br",
      production: "https://signer.fa2s.com.br"
    };
    static texts = {
      read_and_accept: "Li e aceito ",
      accept: "Eu aceito ",
      agree: "Concordo com "
    };
    #agreed = false;
    #mode = "production";
    #base = null;
    #contents = [];
    #signer = null;
    #text = "agree";
    toggle = () => {
    };
    set text(name) {
      this.#text = name;
    }
    set set(val) {
      this.#signer = val;
    }
    get url() {
      throw "Need to be implemented";
    }
    get mode() {
      return this.#mode;
    }
    set mode(val) {
      if (this.constructor.modes.includes(val))
        this.#mode = val;
      else
        throw "Unknown mode";
    }
    get contents() {
      return this.#contents;
    }
    set contents(urls) {
      if (Array.isArray(urls))
        this.#contents = urls;
      else
        throw "Contents muts be an array";
    }
    get base() {
      return this.#base ?? this.constructor.bases[this.#mode];
    }
    set base(value) {
      this.#base = value;
    }
    mount(query) {
      if (!this.#contents.length)
        throw "Contents cannot be empty";
      const container = document.querySelector(query);
      this.root = container.attachShadow({ mode: "closed" });
      let fn;
      switch (this.format) {
        case "line":
          fn = this.#mountLine;
          break;
        case "list":
          fn = this.#mountList;
          break;
        case "auto":
          fn = this.#contents.length > 5 ? this.#mountList : this.#mountLine;
      }
      const widget = fn();
      container.querySelectorAll("style").forEach((style) => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(style.innerHTML);
        this.root.adoptedStyleSheets.push(sheet);
      });
      this.root.append(widget);
    }
    agree() {
      if (!this.#agreed)
        throw "Trying to force agreement";
      const options = {
        method: "POST",
        headers: {
          "Authorization": this.api_key,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: this.buildPayload(this.#signer, this.#contents)
      };
      return fetch(this.url, options).then(
        (resp) => Promise[resp.ok ? "resolve" : "reject"](resp)
      );
    }
    #mountLine = () => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", (ev) => {
        this.#agreed = ev.target.checked;
        this.toggle(ev.target.checked);
      });
      label.append(checkbox);
      const agree = document.createTextNode(this.constructor.texts[this.#text]);
      label.append(agree);
      const links = this.buildEntries(this.#contents);
      switch (links.length) {
        default:
          links.slice(0, -2).forEach((link) => {
            const connector = document.createTextNode(", ");
            label.append(link);
            label.append(connector);
          });
        case 2:
          links.slice(-2, -1).forEach((link) => {
            const connector = document.createTextNode(" e ");
            label.append(link);
            label.append(connector);
          });
        case 1:
          links.slice(-1).forEach((link) => {
            label.append(link);
          });
      }
      return label;
    };
    #mountList = () => {
      const div = document.createElement("div");
      const ul = document.createElement("ul");
      const links = this.buildEntries(this.#contents);
      links.forEach((link) => {
        const li = document.createElement("li");
        li.append(link);
        ul.append(li);
      });
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", (ev) => {
        this.#agreed = ev.target.checked;
        this.toggle(ev.target.checked);
      });
      label.append(checkbox);
      const agree = document.createTextNode("Eu concordo com os documentos acima");
      label.append(agree);
      div.append(ul, label);
      return div;
    };
    #mountTable = () => {
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const tbody = document.createElement("tbody");
      (() => {
        const tr = document.createElement("tr");
        const col_1 = document.createElement("th");
        const col_2 = document.createElement("th");
        col_2.innerText = "Nome";
        tr.append(col_1, col_2);
        thead.append(tr);
      })();
      this.#contents.forEach(({ name, key }) => {
        const tr = document.createElement("tr");
        const col_1 = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "name";
        checkbox.checked = true;
        checkbox.value = key;
        col_1.append(checkbox);
        const col_2 = document.createElement("td");
        const link = this.buildEntry(name, key);
        col_2.append(link);
        tr.append(col_1, col_2);
        tbody.append(tr);
      });
      table.append(thead, tbody);
      return table;
    };
    buildLink() {
      throw "Need to be implemented";
    }
  };

  // src/multisigner.js
  var Multisigner = class extends base_default {
    constructor(api_key) {
      super(api_key);
    }
    get url() {
      return new URL("/api/signatures", this.base);
    }
    buildEntries(contents) {
      return contents.map(({ name, key }) => this.buildEntry(name, key));
    }
    buildEntry(name, key) {
      const link = document.createElement("a");
      const url = new URL(`/api/contents/${key}/preview`, this.base);
      link.text = name;
      link.href = url;
      link.target = "_blank";
      return link;
    }
    buildPayload(signer, contents) {
      return JSON.stringify({
        signature: {
          signer,
          contents
        }
      });
    }
  };
  globalThis.Multisigner = Multisigner;
})();
