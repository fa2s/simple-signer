window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: "swagger.yml",
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis
    ],
    defaultModelsExpandDepth: -1
  });
};
