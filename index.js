// src/index.js

// Enpoints:
import ENDPOINTS from "./src/ENDPOINTS.js";

export const NAME = "toolcase";

function mapServices() {
  const services = import.meta.glob("./src/services/**/*.js", { eager: true });

  const servicesMap = {};
  for (const path in services) {
    const mod = services[path];
    const parts = path.split("/");
    const serviceName = parts.pop().replace(/\.\w+$/, "");
    const serviceUri = [...parts.slice(3), serviceName].join(".");
    servicesMap[serviceUri] = mod.default;
  }

  return servicesMap;
}

function mapComponents() {
  const components = import.meta.glob("./src/components/**/*.vue", { eager: true });

  const componentsMap = {};
  for (const path in components) {
    const mod = components[path];
    const componentName = path.split("/").pop().replace(/\.\w+$/, "");
    componentsMap[componentName] = mod.default;
  }
  return componentsMap;
}

function mapIcons() {
  const icons = import.meta.glob("./src/components/ui-icons/**/*.vue", { eager: true });

  const iconsList = [];
  const iconsMap = {};
  for (const path in icons) {
    const mod = icons[path];
    const iconName = path.split("/").pop().replace(/\.\w+$/, "");
    iconsList.push(iconName);
    iconsMap[iconName] = mod.default;
  }
  return { list: iconsList, components: iconsMap };
}

function mapPages() {
  const pages = import.meta.glob("./src/pages/**/*.vue", { eager: true });

  const pagesMap = {};
  for (const path in pages) {
    const mod = pages[path];
    const configs = mod.__PAGE_CONFIG ?? {};
    const extras = configs.extras ?? {};
    const params = configs.params ?? [];
    const parts = path.split("/");
    const pageName = parts.pop().replace(/\.\w+$/, "");
    const pageUrl = `${NAME}/${[...parts.slice(3), pageName.toLowerCase()].join("/")}`;
    const pageRoute = configs.route ?? `${pageUrl}${params.length > 0 ? `/:${params.join("/:")}` : ""}`;

    pagesMap[pageUrl] = { path: pageRoute, component: mod.default, extras };
  }
  return pagesMap;
}

function mapLayouts() {
  const layouts = import.meta.glob("./src/layouts/**/*.vue", { eager: true });

  const layoutsMap = {};
  for (const path in layouts) {
    const mod = layouts[path];
    const layoutName = path.split("/").pop().replace(/\.\w+$/, "");
    layoutsMap[layoutName] = mod.default;
  }
  return layoutsMap;
}

const _icons = mapIcons();

export default {
  ENDPOINTS,
  SERVICES: mapServices(),
  COMPONENTS: mapComponents(),
  UI_ICONS: _icons.list,
  UI_ICON_COMPONENTS: _icons.components,
  PAGES: mapPages(),
  LAYOUTS: mapLayouts(),
};
