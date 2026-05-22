(() => {
  // src/events.js
  var MountEvent = class extends Event {
    constructor() {
      super("mount", { bubbles: true });
    }
  };
  var ChangeEvent = class extends Event {
    constructor(source) {
      super("change", { bubbles: true });
      this.source = source;
    }
  };
  var UnmountEvent = class extends Event {
    constructor() {
      super("unmount", { bubbles: true });
    }
  };

  // src/wrapper.js
  var Wrapper = class {
    #node;
    #styles = [];
    #mountables = [];
    constructor(container) {
      this.#node = document.createElement("div");
      container.append(this.#node);
      this.#copyCSS(container);
    }
    get ready() {
      return this.#mountables.every((mountable) => mountable.ready);
    }
    push(mountable) {
      this.#mountables.push(mountable);
    }
    mount() {
      const root = this.#node.attachShadow({ mode: "closed" });
      this.#dumpCSS(root);
      this.#mountables.forEach((mountable) => mountable.mount(root));
      const ev = new MountEvent();
      this.#node.parentElement.dispatchEvent(ev);
    }
    unmount() {
      this.#mountables.forEach((mountable) => mountable.unmount());
      const ev = new UnmountEvent();
      this.#node.parentElement.dispatchEvent(ev);
      this.#node.remove();
      this.#node = null;
    }
    #copyCSS(source) {
      const templates = source.querySelectorAll("template");
      templates.forEach((template) => {
        const content = template.content;
        content.querySelectorAll("style").forEach((original) => {
          this.#styles.push(original.innerHTML);
        });
      });
    }
    #dumpCSS(target) {
      this.#styles.forEach((style) => {
        const sheet = document.createElement("style");
        sheet.innerHTML = style;
        target.append(sheet);
      });
    }
  };

  // src/renderers.js
  var Base = class {
    text = "agree";
    checked = false;
    #contents;
    constructor(contents) {
      this.#contents = contents;
    }
    get ready() {
      return this.checked;
    }
    mount(root) {
      throw "Need to be implemented";
    }
    unmount() {
    }
    createCheckbox(wrapper) {
      const checkbox = document.createElement("input");
      checkbox.name = "agree";
      checkbox.type = "checkbox";
      checkbox.checked = this.checked;
      const that = this;
      checkbox.addEventListener("change", (ev) => {
        that.checked = ev.target.checked;
        wrapper.parentElement.dispatchEvent(
          new ChangeEvent(ev.target)
        );
      });
      return checkbox;
    }
    createLinks() {
      return this.#contents.map(({ name, href }) => {
        const link = document.createElement("a");
        link.text = name;
        link.href = href;
        link.target = "_blank";
        return link;
      });
    }
  };
  var LineRenderer = class extends Base {
    static texts = {
      agree: "Concordo com ",
      accept: "Eu aceito ",
      read_and_accept: "Li e aceito "
    };
    mount(root) {
      const label = document.createElement("label");
      const checkbox = this.createCheckbox(root.host);
      const agree = document.createTextNode(this.constructor.texts[this.text]);
      const line = this.createLine();
      label.append(checkbox);
      label.append(agree);
      label.append(...line);
      root.append(label);
    }
    // Warning: I couldn't find easier way to do this. It is not an usual code
    // but it works.
    //
    // Build strings like: foo, bar, gaz and onk
    // There is no missing `break` here! We need to process all cases and
    // default must be the first one
    // Suppose [1, 2, ..., n - 2, n - 1, n]
    createLine() {
      const line = [];
      const links = this.createLinks();
      switch (links.length) {
        default:
          links.slice(0, -2).forEach((link) => {
            const connector = document.createTextNode(", ");
            line.push(link);
            line.push(connector);
          });
        case 2:
          links.slice(-2, -1).forEach((link) => {
            const connector = document.createTextNode(" e ");
            line.push(link);
            line.push(connector);
          });
        case 1:
          links.slice(-1).forEach((link) => {
            line.push(link);
          });
      }
      return line;
    }
  };
  var ListRenderer = class extends Base {
    static texts = {
      agree: "Eu concordo com os documentos acima ",
      accept: "Eu aceito os documentos acima ",
      read_and_accept: "Li e aceito os documentos acima "
    };
    mount(root) {
      const div = document.createElement("div");
      const ul = document.createElement("ul");
      const links = this.createLinks();
      links.forEach((link) => {
        const li = document.createElement("li");
        li.append(link);
        ul.append(li);
      });
      const label = document.createElement("label");
      const checkbox = this.createCheckbox(root.host);
      const agree = document.createTextNode(this.constructor.texts[this.text]);
      label.append(checkbox);
      label.append(agree);
      div.append(ul, label);
      root.append(div);
    }
  };
  var AutoRenderer = class {
    text = "agree";
    checked = false;
    #contents;
    #renderer;
    constructor(contents) {
      this.#contents = contents;
    }
    get ready() {
      return this.#renderer.ready;
    }
    mount(root) {
      let Factory;
      if (this.#contents.length > 5) {
        Factory = ListRenderer;
      } else {
        Factory = LineRenderer;
      }
      const renderer = new Factory(this.#contents);
      renderer.text = this.text;
      renderer.checked = this.checked;
      this.#renderer = renderer;
      this.#renderer.mount(root);
    }
    unmount() {
      this.#renderer.unmount();
    }
  };
  var renderers_default = {
    auto: AutoRenderer,
    line: LineRenderer,
    list: ListRenderer
  };

  // src/backends.js
  var GenericBackend = class {
    contents = [];
    constructor({ base, api_key, signer }) {
      this.base = base;
      this.api_key = api_key;
      this.signer = signer;
    }
    get endpoint() {
      throw "Need to be implemented";
    }
    buildBody() {
      throw "Need to be implemented";
    }
    async sign() {
      const options = {
        method: "POST",
        headers: {
          "Authorization": this.api_key,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: this.buildBody()
      };
      const url = new URL(this.endpoint, this.base);
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error("Failed to fetch", { cause: response });
      return response;
    }
  };
  var Document = class {
    constructor(name, url, tags) {
      this.name = name;
      this.url = url;
      this.tags = tags;
    }
    get href() {
      return this.url;
    }
  };
  var DocumentBackend = class extends GenericBackend {
    get endpoint() {
      return "/api/envelopes";
    }
    buildBody() {
      return JSON.stringify({
        envelope: {
          signer: this.signer,
          contents: this.contents
        }
      });
    }
    // Add document to be signed
    // @param {string} name - text to display at UI
    // @param {string} url - URL to download
    // @param {string[]} tags - Tags to add to a document
    addDocument(name, url, tags) {
      this.contents.push(new Document(name, url, tags));
    }
  };
  var Reference = class {
    constructor(name, key) {
      this.name = name;
      this.key = key;
    }
    get href() {
      return `/api/contents/${this.key}/preview`;
    }
  };
  var ReferenceBackend = class extends GenericBackend {
    get endpoint() {
      return "/api/signatures";
    }
    buildBody() {
      return JSON.stringify({
        signature: {
          signer: this.signer,
          contents: this.contents
        }
      });
    }
    addReference(name, key) {
      this.contents.push(new Reference(name, key));
    }
  };

  // src/signer.js
  var Signer = class {
    signer = null;
    checked = false;
    text = "agree";
    format = "auto";
    base = "https://signer.fa2s.com.br";
    #plugins = [];
    #backend = null;
    #wrapper = null;
    constructor(api_key) {
      if (!api_key)
        throw "Need an API KEY";
      this.api_key = api_key;
    }
    set set(signer) {
      this.signer = signer;
    }
    addDocument({ name, url, tags = [] }) {
      if (!this.#backend)
        this.#backend = new DocumentBackend(this);
      if (this.#backend.addDocument)
        this.#backend.addDocument(name, url, tags);
      else
        throw "You can add only documents";
    }
    addReference({ name, key }) {
      if (!this.#backend)
        this.#backend = new ReferenceBackend(this);
      if (this.#backend.addReference)
        this.#backend.addReference(name, key);
      else
        throw "You can add only references";
    }
    addPlugin(plugin) {
      this.#plugins.push(plugin);
    }
    mount(container) {
      if (!this.#backend)
        throw "You must add at least one contents";
      this.#wrapper = new Wrapper(container);
      const renderer = new renderers_default[this.format](this.#backend.contents);
      renderer.text = this.text;
      renderer.checked = this.checked;
      this.#wrapper.push(renderer);
      this.#plugins.forEach((plugin) => this.#wrapper.push(plugin));
      this.#wrapper.mount();
    }
    unmount() {
      this.#wrapper.unmount();
    }
    async sign() {
      if (!this.#wrapper.ready)
        throw new Error("Trying to force agreement");
      await Promise.all(this.#plugins.map((plugin) => plugin.sign(this.#backend)));
      return await this.#backend.sign();
    }
  };
  globalThis.Signer = Signer;
})();
