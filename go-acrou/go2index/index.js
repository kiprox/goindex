/**
 * @author keybase.io/candro
 * @kiprox
 */

// =======Options START=======
var authConfig = {
  siteName: "multihub", // Nama situs
  version: "1.1.2", // Versi Program
  theme: "acrou",
  // RECOMMENDED Untuk menggunakan client_id & client_secret milik sendiri 
  client_id: "202264815644.apps.googleusercontent.com",
  client_secret: "X4Z3ca8xfWDb1Voo-F9a7ZxJ",
  refresh_token: "", // Otorisasi token
  /**
   * Siapkan beberapa Drive untuk ditampilkan; tambahkan beberapa menurut format
   * [id]: Bisa ID Team Drives、ID subfolder、atau "root"（Direktori root disk pribadi）；
   * [name]: Nama yang ditampilkan
   * [user]: Basic Auth dari Nama pengguna
   * [pass]: Basic Auth Kata sandi
   * [protect_file_link]: Basic Auth digunakan untuk melindungi tautan file, nilai default (jika tidak disetel), false = tautan file tidak dilindungi (untuk unduhan tautan langsung / pemutaran eksternal, dll.)
   * Per disk Basic Auth Dapat diatur secara individual。Basic Auth; Lindungi semua jalur folder / subfolder di bawah disk secara default
   * [Catatan] Tautan file tidak dilindungi secara default, yang dapat memfasilitasi unduhan tautan langsung / pemutaran eksternal;
   * Jika Anda ingin melindungi link file, Anda perlu menyetel protect_file_link ke true. Jika Anda ingin melakukan pemutaran eksternal dan operasi lain, Anda perlu mengganti host dengan user: pass @ host.      
   * Tidak diperlukan disk Autentikasi Dasar, biarkan pengguna dan operasikan tetap kosong pada saat yang bersamaan. (Dapat diatur secara langsung tanpa pengaturan)
   * [Note] Fungsi pencarian tidak didukung untuk disk yang id-nya ditetapkan sebagai id subfolder (tidak mempengaruhi disk lain).
   */
  roots: [
    {
      id: "",
      name: "TeamDrive",
      pass: "",
    },
    {
      id: "root",
      name: "PrivateDrive",
      user: "",
      pass: "",
      protect_file_link: true,
    },
    {
      id: "",
      name: "folder1",
      pass: "",
    },
  ],
  default_gd: 0,
  /**
   * Jumlah file yang ditampilkan di setiap halaman halaman daftar file. [Pengaturan yang disarankan adalah antara 100 dan 1000];
   * Jika pengaturan lebih besar dari 1000, ini akan menyebabkan kesalahan saat meminta api drive;
   * Jika nilai yang ditetapkan terlalu kecil, ini akan menyebabkan pemuatan tambahan bilah gulir halaman daftar file (pemuatan halaman) gagal;
   * Efek lain dari nilai ini adalah jika jumlah file dalam direktori lebih besar dari nilai pengaturan ini (artinya, tampilan multi-halaman diperlukan), hasil daftar pertama akan di-cache.
   */
  files_list_page_size: 50,
  /**
   * Jumlah halaman hasil pencarian yang ditampilkan per halaman。[Pengaturan yang disarankan adalah antara 50 dan 1000];
   * Jika pengaturan lebih besar dari 1000, ini akan menyebabkan error saat meminta api drive;
   * Jika nilai yang ditetapkan terlalu kecil, ini akan menyebabkan pemuatan tambahan bilah gulir halaman hasil pencarian (pemuatan halaman) gagal;
   * Besar kecilnya nilai ini mempengaruhi kecepatan respon operasi pencarian.
   */
  search_result_list_page_size: 50,
  // Pastikan bahwa itu dapat diaktifkan dengan tujuan cors
  enable_cors_file_down: false,
  /**
   * Autentikasi dasar di atas sudah menyertakan fungsi perlindungan global di disk. Oleh karena itu, sandi dalam file .password tidak lagi diautentikasi secara default;
   * Jika berdasarkan autentikasi global, Anda masih perlu memverifikasi sandi secara terpisah di file .password untuk beberapa direktori, setel opsi ini ke true;
   * [Note] Jika verifikasi kata sandi dari file .password diaktifkan, setiap kali direktori dicantumkan, overhead tambahan untuk menanyakan apakah file .password ada di direktori akan ditambahkan.
   */
  enable_password_file_verify: false,
};

var themeOptions = {
  cdn: "https://cdn.jsdelivr.net/gh/kiprox/goindex",
  // Nomor versi tema
  version: "1.0.0",
  // Bahasa sistem default [opsional] :en/zh-chs/id
  languages: "en",
  render: {
    /**
     * Apakah akan merender file HEAD.md
     * Render HEAD.md file
     */
    head_md: false,
    /**
     * Apakah akan merender file README.md
     * Render README.md file
     */
    readme_md: false,
    /**
     * Apakah akan merender deskripsi file / folder
     * Render file/folder description or not
     */
    desc: false,
  },
  /**
   * Pilihan pemutar video
   * Video player options
   */
  video: {
    /**
     * Api Player (gunakan pemutar default jika tidak ditentukan)
     * Player api(Use default player if not specified)
     */
    api: "",
    autoplay: true,
  },
  /**
   * Pilihan pemutar audio
   * Audio player options
   */
  audio: {},
};
// =======Options END=======

/**
 * global functions
 */
const FUNCS = {
  /**
   * Dikonversi menjadi kata kunci pencarian yang relatif aman untuk leksikon pencarian Google
   */
  formatSearchKeyword: function(keyword) {
    let nothing = "";
    let space = " ";
    if (!keyword) return nothing;
    return keyword
      .replace(/(!=)|['"=<>/\\:]/g, nothing)
      .replace(/[,，|(){}]/g, space)
      .trim();
  },
};

/**
 * global consts
 * @type {{folder_mime_type: string, default_file_fields: string, gd_root_type: {share_drive: number, user_drive: number, sub_folder: number}}}
 */
const CONSTS = new (class {
  default_file_fields =
    "parents,id,name,mimeType,modifiedTime,createdTime,fileExtension,size";
  gd_root_type = {
    user_drive: 0,
    share_drive: 1,
    sub_folder: 2,
  };
  folder_mime_type = "application/vnd.google-apps.folder";
})();

// gd instances
var gds = [];

function html(current_drive_order = 0, model = {}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta name="viewport" content="width=device-width, initial-scale=1.0,maximum-scale=1.0, user-scalable=no"><meta name="apple-mobile-web-app-capable" content="yes"> <title>${authConfig.siteName}</title> <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1"><meta name="description" content="Powerfull of Storage Cloud Drive will allow to index your files on the browser with Cloudflare Workers."><meta name="theme-color" content="#FF3300"><meta name="application-name" content="multihub"><meta name="robots" content="index, follow"><meta name="twitter:card" content="summary"><meta name="twitter:image" content="https://i.imgur.com/rOyuGjA.gif"><meta name="twitter:description" content="Powerfull of Storage Cloud Drive will allow to index your files on the browser with Cloudflare Workers."><meta name="keywords" content="multihub, kiprox, google, drive, goindex, gdindex, classic, material, workers-script, oauth-consent-screen, google-drive, cloudflare-workers, themes"><meta name="twitter:title" content="Multihub"><meta name="twitter:url" content="https://github.com/kiprox/goindex"><link rel="shortcut icon" href="https://i.imgur.com/rOyuGjA.gif"><meta property="og:site_name" content="Multihub"><meta property="og:type" content="website"><meta property="og:image" content="https://i.imgur.com/rOyuGjA.gif"><meta property="og:description" content="Powerfull of Storage Cloud Drive will allow to index your files on the browser with Cloudflare Workers."><meta property="og:title" content="Multihub"><meta property="og:url" content="https://github.com/kiprox/goindex"><link rel="apple-touch-icon" href="https://i.imgur.com/rOyuGjA.gif"><link rel="icon" type="image/png" sizes="32x32" href="https://i.imgur.com/rOyuGjA.gif"><meta name="google-site-verification" content=""/><script async src="https://www.googletagmanager.com/gtag/js?id=UA-53XLXB4"></script><script>window.dataLayer=window.dataLayer || []; function gtag(){dataLayer.push(arguments);}gtag('js', new Date()); gtag('config', 'UA-53XLXB4');</script><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id=GTM-53XLXB4'+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-53XLXB4');</script> <style>@import url(${themeOptions.cdn}@${themeOptions.version}/go-acrou/dist/style.min.css); </style> <script>window.gdconfig=JSON.parse('${JSON.stringify({version: authConfig.version, themeOptions: themeOptions,})}'); window.themeOptions=JSON.parse('${JSON.stringify(themeOptions)}'); window.gds=JSON.parse('${JSON.stringify( authConfig.roots.map((it)=> it.name) )}'); window.MODEL=JSON.parse('${JSON.stringify(model)}'); window.current_drive_order=${current_drive_order}; </script>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-53XLXB4"height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <div id="app"></div>
    <script src="${themeOptions.cdn}@${
    themeOptions.version
  }/go-acrou/dist/app.min.js"></script>
</body>
</html>
`;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Fetch and log a request
 * @param {Request} request
 */
async function handleRequest(request) {
  if (gds.length === 0) {
    for (let i = 0; i < authConfig.roots.length; i++) {
      const gd = new googleDrive(authConfig, i);
      await gd.init();
      gds.push(gd);
    }
    // Operasi ini paralel untuk meningkatkan efisiensi
    let tasks = [];
    gds.forEach((gd) => {
      tasks.push(gd.initRootType());
    });
    for (let task of tasks) {
      await task;
    }
  }

  // Ekstrak urutan drive dari jalur
  // Dan dapatkan instance gd yang sesuai sesuai dengan urutan drive
  let gd;
  let url = new URL(request.url);
  let path = decodeURI(url.pathname);

  /**
   * Alihkan ke halaman awal
   * @returns {Response}
   */
  function redirectToIndexPage() {
    return new Response("", {
      status: 301,
      headers: { Location: `/${authConfig.default_gd}:/` },
    });
  }

  if (path == "/") return redirectToIndexPage();
  if (path.toLowerCase() == "/favicon.ico") {
    // Anda dapat mengganti favicon nanti
    return new Response("", { status: 404 });
  }

  // Format perintah khusus
  const command_reg = /^\/(?<num>\d+):(?<command>[a-zA-Z0-9]+)(\/.*)?$/g;
  const match = command_reg.exec(path);
  let command;
  if (match) {
    const num = match.groups.num;
    const order = Number(num);
    if (order >= 0 && order < gds.length) {
      gd = gds[order];
    } else {
      return redirectToIndexPage();
    }
    // basic auth
    for (const r = gd.basicAuthResponse(request); r; ) return r;
    command = match.groups.command;

    // pencarian untuk
    if (command === "search") {
      if (request.method === "POST") {
        // Hasil Pencarian
        return handleSearch(request, gd);
      } else {
        const params = url.searchParams;
        // Halaman pencarian
        return new Response(
          html(gd.order, {
            q: params.get("q") || "",
            is_search_page: true,
            root_type: gd.root_type,
          }),
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      }
    } else if (command === "id2path" && request.method === "POST") {
      return handleId2Path(request, gd);
    } else if (command === "view") {
      const params = url.searchParams;
      return gd.view(params.get("url"), request.headers.get("Range"));
    } else if (command !== "down" && request.method === "GET") {
      return new Response(html(gd.order, { root_type: gd.root_type }), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }
  const reg = new RegExp(`^(/\\d+:)${command}/`, "g");
  path = path.replace(reg, (p1, p2) => {
    return p2 + "/";
  });
  // Format jalur yang diharapkan
  const common_reg = /^\/\d+:\/.*$/g;
  try {
    if (!path.match(common_reg)) {
      return redirectToIndexPage();
    }
    let split = path.split("/");
    let order = Number(split[1].slice(0, -1));
    if (order >= 0 && order < gds.length) {
      gd = gds[order];
    } else {
      return redirectToIndexPage();
    }
  } catch (e) {
    return redirectToIndexPage();
  }

  // basic auth
  // for (const r = gd.basicAuthResponse(request); r;) return r;
  const basic_auth_res = gd.basicAuthResponse(request);
  path = path.replace(gd.url_path_prefix, "") || "/";
  if (request.method == "POST") {
    return basic_auth_res || apiRequest(request, gd);
  }

  let action = url.searchParams.get("a");

  if (path.substr(-1) == "/" || action != null) {
    return (
      basic_auth_res ||
      new Response(html(gd.order, { root_type: gd.root_type }), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    );
  } else {
    if (
      path
        .split("/")
        .pop()
        .toLowerCase() == ".password"
    ) {
      return basic_auth_res || new Response("", { status: 404 });
    }
    let file = await gd.file(path);
    let range = request.headers.get("Range");
    if (gd.root.protect_file_link && basic_auth_res) return basic_auth_res;
    const is_down = !(command && command == "down");
    return gd.down(file.id, range, is_down);
  }
}

async function apiRequest(request, gd) {
  let url = new URL(request.url);
  let path = url.pathname;
  path = path.replace(gd.url_path_prefix, "") || "/";

  let option = { status: 200, headers: { "Access-Control-Allow-Origin": "*" } };

  if (path.substr(-1) == "/") {
    let deferred_pass = gd.password(path);
    let body = await request.text();
    body = JSON.parse(body);
    // Ini dapat meningkatkan kecepatan saat membuat daftar direktori untuk pertama kalinya. Kerugiannya adalah jika verifikasi kata sandi gagal, overhead direktori pencatatan masih akan timbul
    let deferred_list_result = gd.list(
      path,
      body.page_token,
      Number(body.page_index)
    );

    // check .password file, if `enable_password_file_verify` is true
    if (authConfig["enable_password_file_verify"]) {
      let password = await gd.password(path);
      // console.log("dir password", password);
      if (password && password.replace("\n", "") !== body.password) {
        let html = `{"error": {"code": 401,"message": "password error."}}`;
        return new Response(html, option);
      }
    }

    let list_result = await deferred_list_result;
    return new Response(JSON.stringify(list_result), option);
  } else {
    let file = await gd.file(path);
    let range = request.headers.get("Range");
    return new Response(JSON.stringify(file));
  }
}

//  berurusan dengan pencarian
async function handleSearch(request, gd) {
  const option = {
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
  };
  let body = await request.text();
  body = JSON.parse(body);
  let search_result = await gd.search(
    body.q || "",
    body.page_token,
    Number(body.page_index)
  );
  return new Response(JSON.stringify(search_result), option);
}

/**
 * berurusan dengan id2path
 * @param permintaan membutuhkan parameter id
 * @param gd
 * @returns {Promise<Response>} [Note] Jika item yang diwakili oleh id yang diterima dari meja depan tidak di bawah disk gd target, respons akan mengembalikan string kosong ke meja depan ""
 */
async function handleId2Path(request, gd) {
  const option = {
    status: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
  };
  let body = await request.text();
  body = JSON.parse(body);
  let path = await gd.findPathById(body.id);
  return new Response(path || "", option);
}

class googleDrive {
  constructor(authConfig, order) {
    // Setiap disk sesuai dengan pesanan, sesuai dengan instance gd
    this.order = order;
    this.root = authConfig.roots[order];
    this.root.protect_file_link = this.root.protect_file_link || false;
    this.url_path_prefix = `/${order}:`;
    this.authConfig = authConfig;
    // TODO: Setiap disk sesuai dengan urutan, sesuai dengan instance gd
    // path id
    this.paths = [];
    // path file
    this.files = [];
    // path pass
    this.passwords = [];
    // id <-> path
    this.id_path_cache = {};
    this.id_path_cache[this.root["id"]] = "/";
    this.paths["/"] = this.root["id"];
    /*if (this.root['pass'] != "") {
            this.passwords['/'] = this.root['pass'];
        }*/
    // this.init();
  }

  /**
   * Otorisasi awal; kemudian dapatkan user_drive_real_root_id
   * @returns {Promise<void>}
   */
  async init() {
    await this.accessToken();
    /*await (async () => {
            // Hanya bisa sekali
            if (authConfig.user_drive_real_root_id) return;
            const root_obj = await (gds[0] || this).findItemById('root');
            if (root_obj && root_obj.id) {
                authConfig.user_drive_real_root_id = root_obj.id
            }
        })();*/
    // Tunggu user_drive_real_root_id ，Hanya bisa 1 kali
    if (authConfig.user_drive_real_root_id) return;
    const root_obj = await (gds[0] || this).findItemById("root");
    if (root_obj && root_obj.id) {
      authConfig.user_drive_real_root_id = root_obj.id;
    }
  }

  /**
   * Dapatkan jenis direktori root, setel ke root_type
   * @returns {Promise<void>}
   */
  async initRootType() {
    const root_id = this.root["id"];
    const types = CONSTS.gd_root_type;
    if (root_id === "root" || root_id === authConfig.user_drive_real_root_id) {
      this.root_type = types.user_drive;
    } else {
      const obj = await this.getShareDriveObjById(root_id);
      this.root_type = obj ? types.share_drive : types.sub_folder;
    }
  }

  /**
   * Returns a response that requires authorization, or null
   * @param request
   * @returns {Response|null}
   */
  basicAuthResponse(request) {
    const user = this.root.user || "",
      pass = this.root.pass || "",
      _401 = new Response("Unauthorized", {
        headers: {
          "WWW-Authenticate": `Basic realm="goindex:drive:${this.order}"`,
        },
        status: 401,
      });
    if (user || pass) {
      const auth = request.headers.get("Authorization");
      if (auth) {
        try {
          const [received_user, received_pass] = atob(
            auth.split(" ").pop()
          ).split(":");
          return received_user === user && received_pass === pass ? null : _401;
        } catch (e) {}
      }
    } else return null;
    return _401;
  }

  async view(url, range = "", inline = true) {
    let requestOption = await this.requestOption();
    requestOption.headers["Range"] = range;
    let res = await fetch(url, requestOption);
    const { headers } = (res = new Response(res.body, res));
    this.authConfig.enable_cors_file_down &&
      headers.append("Access-Control-Allow-Origin", "*");
    inline === true && headers.set("Content-Disposition", "inline");
    return res;
  }

  async down(id, range = "", inline = false) {
    let url = `https://www.googleapis.com/drive/v3/files/${id}?alt=media`;
    let requestOption = await this.requestOption();
    requestOption.headers["Range"] = range;
    let res = await fetch(url, requestOption);
    const { headers } = (res = new Response(res.body, res));
    this.authConfig.enable_cors_file_down &&
      headers.append("Access-Control-Allow-Origin", "*");
    inline === true && headers.set("Content-Disposition", "inline");
    return res;
  }

  async file(path) {
    if (typeof this.files[path] == "undefined") {
      this.files[path] = await this._file(path);
    }
    return this.files[path];
  }

  async _file(path) {
    let arr = path.split("/");
    let name = arr.pop();
    name = decodeURIComponent(name).replace(/\'/g, "\\'");
    let dir = arr.join("/") + "/";
    // console.log(name, dir);
    let parent = await this.findPathId(dir);
    // console.log(parent);
    let url = "https://www.googleapis.com/drive/v3/files";
    let params = { includeItemsFromAllDrives: true, supportsAllDrives: true };
    params.q = `'${parent}' in parents and name = '${name}' and trashed = false`;
    params.fields =
      "files(id, name, mimeType, size ,createdTime, modifiedTime, iconLink, thumbnailLink)";
    url += "?" + this.enQuery(params);
    let requestOption = await this.requestOption();
    let response = await fetch(url, requestOption);
    let obj = await response.json();
    // console.log(obj);
    return obj.files[0];
  }

  // Cache melalui cache reqeust
  async list(path, page_token = null, page_index = 0) {
    if (this.path_children_cache == undefined) {
      // { <path> :[ {nextPageToken:'',data:{}}, {nextPageToken:'',data:{}} ...], ...}
      this.path_children_cache = {};
    }

    if (
      this.path_children_cache[path] &&
      this.path_children_cache[path][page_index] &&
      this.path_children_cache[path][page_index].data
    ) {
      let child_obj = this.path_children_cache[path][page_index];
      return {
        nextPageToken: child_obj.nextPageToken || null,
        curPageIndex: page_index,
        data: child_obj.data,
      };
    }

    let id = await this.findPathId(path);
    let result = await this._ls(id, page_token, page_index);
    let data = result.data;
    // Cache untuk banyak halaman
    if (result.nextPageToken && data.files) {
      if (!Array.isArray(this.path_children_cache[path])) {
        this.path_children_cache[path] = [];
      }
      this.path_children_cache[path][Number(result.curPageIndex)] = {
        nextPageToken: result.nextPageToken,
        data: data,
      };
    }

    return result;
  }

  async _ls(parent, page_token = null, page_index = 0) {
    // console.log("_ls", parent);

    if (parent == undefined) {
      return null;
    }
    let obj;
    let params = { includeItemsFromAllDrives: true, supportsAllDrives: true };
    params.q = `'${parent}' in parents and trashed = false AND name !='.password'`;
    params.orderBy = "folder,name,modifiedTime desc";
    params.fields =
      "nextPageToken, files(id, name, mimeType, size , modifiedTime, thumbnailLink, description)";
    params.pageSize = this.authConfig.files_list_page_size;

    if (page_token) {
      params.pageToken = page_token;
    }
    let url = "https://www.googleapis.com/drive/v3/files";
    url += "?" + this.enQuery(params);
    let requestOption = await this.requestOption();
    let response = await fetch(url, requestOption);
    obj = await response.json();

    return {
      nextPageToken: obj.nextPageToken || null,
      curPageIndex: page_index,
      data: obj,
    };

    /*do {
            if (pageToken) {
                params.pageToken = pageToken;
            }
            let url = 'https://www.googleapis.com/drive/v3/files';
            url += '?' + this.enQuery(params);
            let requestOption = await this.requestOption();
            let response = await fetch(url, requestOption);
            obj = await response.json();
            files.push(...obj.files);
            pageToken = obj.nextPageToken;
        } while (pageToken);*/
  }

  async password(path) {
    if (this.passwords[path] !== undefined) {
      return this.passwords[path];
    }

    // console.log("load", path, ".password", this.passwords[path]);

    let file = await this.file(path + ".password");
    if (file == undefined) {
      this.passwords[path] = null;
    } else {
      let url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      let requestOption = await this.requestOption();
      let response = await this.fetch200(url, requestOption);
      this.passwords[path] = await response.text();
    }

    return this.passwords[path];
  }

  /**
   * Dapatkan berbagi informasi drive berdasarkan id
   * @param any_id
   * @returns {Promise<null|{id}|any>} Situasi abnormal apa pun akan kembali null
   */
  async getShareDriveObjById(any_id) {
    if (!any_id) return null;
    if ("string" !== typeof any_id) return null;

    let url = `https://www.googleapis.com/drive/v3/drives/${any_id}`;
    let requestOption = await this.requestOption();
    let res = await fetch(url, requestOption);
    let obj = await res.json();
    if (obj && obj.id) return obj;

    return null;
  }

  /**
   * pencarian untuk
   * @returns {Promise<{data: null, nextPageToken: null, curPageIndex: number}>}
   */
  async search(origin_keyword, page_token = null, page_index = 0) {
    const types = CONSTS.gd_root_type;
    const is_user_drive = this.root_type === types.user_drive;
    const is_share_drive = this.root_type === types.share_drive;

    const empty_result = {
      nextPageToken: null,
      curPageIndex: page_index,
      data: null,
    };

    if (!is_user_drive && !is_share_drive) {
      return empty_result;
    }
    let keyword = FUNCS.formatSearchKeyword(origin_keyword);
    if (!keyword) {
      // Kata kunci kosong, kembali
      return empty_result;
    }
    let words = keyword.split(/\s+/);
    let name_search_str = `name contains '${words.join(
      "' AND name contains '"
    )}'`;

    // Untuk perusahaan, pengguna adalah disk pribadi, dan drive adalah disk tim. Cocokkan driveId
    let params = {};
    if (is_user_drive) {
      params.corpora = "user";
    }
    if (is_share_drive) {
      params.corpora = "drive";
      params.driveId = this.root.id;
      // This parameter will only be effective until June 1, 2020. Afterwards shared drive items will be included in the results.
      params.includeItemsFromAllDrives = true;
      params.supportsAllDrives = true;
    }
    if (page_token) {
      params.pageToken = page_token;
    }
    params.q = `trashed = false AND name !='.password' AND (${name_search_str})`;
    params.fields =
      "nextPageToken, files(id, name, mimeType, size , modifiedTime, thumbnailLink, description)";
    params.pageSize = this.authConfig.search_result_list_page_size;
    // params.orderBy = 'folder,name,modifiedTime desc';

    let url = "https://www.googleapis.com/drive/v3/files";
    url += "?" + this.enQuery(params);
    // console.log(params)
    let requestOption = await this.requestOption();
    let response = await fetch(url, requestOption);
    let res_obj = await response.json();

    return {
      nextPageToken: res_obj.nextPageToken || null,
      curPageIndex: page_index,
      data: res_obj,
    };
  }

  /**
   * Dapatkan objek file dari folder induk dari file atau folder ini satu per satu ke atas. Catatan: ini akan lambat! ! !
   * Temukan direktori root dari objek gd saat ini (root id)
   * Pertimbangkan hanya satu rantai ke atas.
   * [Note] Jika item yang diwakili oleh ID ini tidak ada dalam disk gd target, maka fungsi ini akan kembali ke null
   *
   * @param child_id
   * @param contain_myself
   * @returns {Promise<[]>}
   */
  async findParentFilesRecursion(child_id, contain_myself = true) {
    const gd = this;
    const gd_root_id = gd.root.id;
    const user_drive_real_root_id = authConfig.user_drive_real_root_id;
    const is_user_drive = gd.root_type === CONSTS.gd_root_type.user_drive;

    // ID tujuan akhir untuk kueri bottom-up
    const target_top_id = is_user_drive ? user_drive_real_root_id : gd_root_id;
    const fields = CONSTS.default_file_fields;

    // [{},{},...]
    const parent_files = [];
    let meet_top = false;

    async function addItsFirstParent(file_obj) {
      if (!file_obj) return;
      if (!file_obj.parents) return;
      if (file_obj.parents.length < 1) return;

      // ['','',...]
      let p_ids = file_obj.parents;
      if (p_ids && p_ids.length > 0) {
        // its first parent
        const first_p_id = p_ids[0];
        if (first_p_id === target_top_id) {
          meet_top = true;
          return;
        }
        const p_file_obj = await gd.findItemById(first_p_id);
        if (p_file_obj && p_file_obj.id) {
          parent_files.push(p_file_obj);
          await addItsFirstParent(p_file_obj);
        }
      }
    }

    const child_obj = await gd.findItemById(child_id);
    if (contain_myself) {
      parent_files.push(child_obj);
    }
    await addItsFirstParent(child_obj);

    return meet_top ? parent_files : null;
  }

  /**
   * Dapatkan jalur relatif ke direktori root disk
   * @param child_id
   * @returns {Promise<string>} [Note] Jika item yang diwakili oleh id ini tidak ada di gd disk target, maka metode ini akan mengembalikan string kosong ""
   */
  async findPathById(child_id) {
    if (this.id_path_cache[child_id]) {
      return this.id_path_cache[child_id];
    }

    const p_files = await this.findParentFilesRecursion(child_id);
    if (!p_files || p_files.length < 1) return "";

    let cache = [];
    // Jalur Cache dan ID dari setiap level yang ditemukan
    p_files.forEach((value, idx) => {
      const is_folder =
        idx === 0 ? p_files[idx].mimeType === CONSTS.folder_mime_type : true;
      let path =
        "/" +
        p_files
          .slice(idx)
          .map((it) => it.name)
          .reverse()
          .join("/");
      if (is_folder) path += "/";
      cache.push({ id: p_files[idx].id, path: path });
    });

    cache.forEach((obj) => {
      this.id_path_cache[obj.id] = obj.path;
      this.paths[obj.path] = obj.id;
    });

    /*const is_folder = p_files[0].mimeType === CONSTS.folder_mime_type;
        let path = '/' + p_files.map(it => it.name).reverse().join('/');
        if (is_folder) path += '/';*/

    return cache[0].path;
  }

  // Dapatkan item file sesuai dengan ID
  async findItemById(id) {
    const is_user_drive = this.root_type === CONSTS.gd_root_type.user_drive;
    let url = `https://www.googleapis.com/drive/v3/files/${id}?fields=${
      CONSTS.default_file_fields
    }${is_user_drive ? "" : "&supportsAllDrives=true"}`;
    let requestOption = await this.requestOption();
    let res = await fetch(url, requestOption);
    return await res.json();
  }

  async findPathId(path) {
    let c_path = "/";
    let c_id = this.paths[c_path];

    let arr = path.trim("/").split("/");
    for (let name of arr) {
      c_path += name + "/";

      if (typeof this.paths[c_path] == "undefined") {
        let id = await this._findDirId(c_id, name);
        this.paths[c_path] = id;
      }

      c_id = this.paths[c_path];
      if (c_id == undefined || c_id == null) {
        break;
      }
    }
    // console.log(this.paths);
    return this.paths[path];
  }

  async _findDirId(parent, name) {
    name = decodeURIComponent(name).replace(/\'/g, "\\'");

    // console.log("_findDirId", parent, name);

    if (parent == undefined) {
      return null;
    }

    let url = "https://www.googleapis.com/drive/v3/files";
    let params = { includeItemsFromAllDrives: true, supportsAllDrives: true };
    params.q = `'${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${name}'  and trashed = false`;
    params.fields = "nextPageToken, files(id, name, mimeType)";
    url += "?" + this.enQuery(params);
    let requestOption = await this.requestOption();
    let response = await fetch(url, requestOption);
    let obj = await response.json();
    if (obj.files[0] == undefined) {
      return null;
    }
    return obj.files[0].id;
  }

  async accessToken() {
    console.log("accessToken");
    if (
      this.authConfig.expires == undefined ||
      this.authConfig.expires < Date.now()
    ) {
      const obj = await this.fetchAccessToken();
      if (obj.access_token != undefined) {
        this.authConfig.accessToken = obj.access_token;
        this.authConfig.expires = Date.now() + 3500 * 1000;
      }
    }
    return this.authConfig.accessToken;
  }

  async fetchAccessToken() {
    console.log("fetchAccessToken");
    const url = "https://www.googleapis.com/oauth2/v4/token";
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const post_data = {
      client_id: this.authConfig.client_id,
      client_secret: this.authConfig.client_secret,
      refresh_token: this.authConfig.refresh_token,
      grant_type: "refresh_token",
    };

    let requestOption = {
      method: "POST",
      headers: headers,
      body: this.enQuery(post_data),
    };

    const response = await fetch(url, requestOption);
    return await response.json();
  }

  async fetch200(url, requestOption) {
    let response;
    for (let i = 0; i < 3; i++) {
      response = await fetch(url, requestOption);
      console.log(response.status);
      if (response.status != 403) {
        break;
      }
      await this.sleep(800 * (i + 1));
    }
    return response;
  }

  async requestOption(headers = {}, method = "GET") {
    const accessToken = await this.accessToken();
    headers["authorization"] = "Bearer " + accessToken;
    return { method: method, headers: headers };
  }

  enQuery(data) {
    const ret = [];
    for (let d in data) {
      ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
    }
    return ret.join("&");
  }

  sleep(ms) {
    return new Promise(function(resolve, reject) {
      let i = 0;
      setTimeout(function() {
        console.log("sleep" + ms);
        i++;
        if (i >= 2) reject(new Error("i>=2"));
        else resolve(i);
      }, ms);
    });
  }
}

String.prototype.trim = function(char) {
  if (char) {
    return this.replace(
      new RegExp("^\\" + char + "+|\\" + char + "+$", "g"),
      ""
    );
  }
  return this.replace(/^\s+|\s+$/g, "");
};
