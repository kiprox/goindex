// Because too many lazy loading pages will cause the webpack hot update to be too slow, so the development environment does not use lazy loading, only the production environment uses lazy loading
const _import = require("@/libs/util.import." + process.env.NODE_ENV);

const meta = {
  // keepAlive: true
  disableCache: false,
};

const frameIn = [
  {
    path: "/:id(\\d+)::cmd(text)/:path",
    component: _import("page/GoView"),
    meta: {
      ...meta,
      view: "text",
    },
    children: [
      {
        path: "",
        component: _import("page/GoText"),
      },
    ],
  },
  {
    path: "/:id(\\d+)::cmd(pdf)/:path",
    component: _import("page/GoView"),
    meta: {
      ...meta,
      view: "pdf",
    },
    children: [
      {
        path: "",
        component: _import("page/GoPdf"),
      },
    ],
  },
  {
    path: "/:id(\\d+)::cmd(video)/:path",
    component: _import("page/GoView"),
    meta: {
      ...meta,
      view: "video",
    },
    children: [
      {
        path: "",
        component: _import("page/GoVideo"),
      },
    ],
  },
  {
    path: "/:id(\\d+)::cmd(search)(/?q=)*",
    component: _import("page/GoList"),
    meta: {
      ...meta,
      view: "list",
    },
  },
  {
    path: "/:id(\\d+):/:path*",
    component: _import("page/GoList"),
    meta: {
      ...meta,
      view: "list",
    },
  },
];

export default frameIn;
