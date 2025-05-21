class Multisigner {
  constructor(api_key) {
    if (!api_key)
      throw "Need an API KEY";
    this.api_key = api_key;
  }
  static modes = ["development", "staging", "production"];
  static bases = {
    staging: "https://staging.fa2s.com.br",
    production: "https://signer.fa2s.com.br"
  };
  static #texts = {
    read_and_accept: "Li e aceito ",
    accept: "Eu aceito ",
    agree: "Concordo com "
  };
  static texts() {
    return this.#texts;
  }
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
  set base(val) {
    this.#base = val;
  }
  mount(query) {
    const self = this;
    if (!this.#contents.length)
      throw "Contents cannot be empty";
    const root = document.querySelector(query).attachShadow({ mode: "closed" });
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", (ev) => {
      this.#agreed = ev.target.checked;
      this.toggle(ev.target.checked);
    });
    label.append(checkbox);
    const agree = document.createTextNode(this.constructor.#texts[this.#text]);
    label.append(agree);
    const links = this.#contents.map(({ name, key }) => {
      const link = document.createElement("a");
      const url = new URL(`/api/contents/${key}/preview`, this.base);
      link.text = name;
      link.href = url;
      link.target = "_blank";
      return link;
    });
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
    root.append(label);
  }
  agree() {
    if (!this.#agreed)
      throw "Trying to force agreement";
    const url = new URL("/api/signatures", this.base);
    const options = {
      method: "POST",
      headers: {
        "Authorization": this.api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        signature: {
          signer: this.#signer,
          contents: this.#contents
        }
      })
    };
    return fetch(url, options).then(
      (resp) => Promise[resp.ok ? "resolve" : "reject"](resp)
    );
  }
}
