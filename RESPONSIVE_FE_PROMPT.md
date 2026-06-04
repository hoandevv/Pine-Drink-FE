# Prompt Sua Responsive Frontend

Ban la senior frontend engineer. Hay ra soat toan bo giao dien frontend hien tai va cai thien responsive cho mobile, tablet, desktop.

## Muc tieu chinh

- Giao dien phai hien thi tot tren dien thoai, dac biet width 320px, 360px, 375px, 390px, 414px.
- Khong duoc tran ngang man hinh.
- Khong bi vo layout, de chu, mat nut, mat noi dung.
- Cac section dai phai duoc chia bo cuc hop ly, de doc, de thao tac.
- Giu nguyen chuc nang hien co, chi cai thien UI/UX va responsive.
- Neu project da co design system, mau sac, spacing, component style san thi giu theo style hien tai.

## Viec can lam

### 1. Kiem tra tong the responsive

- Ra soat tat ca page, layout, component chinh.
- Kiem tra header, navbar, sidebar, footer, form, table, card, modal, dropdown, filter, search box, pagination.
- Xac dinh cho nao gay overflow ngang.
- Xac dinh section nao qua dai, qua chat, qua nhieu chu tren mobile.
- Kiem tra breakpoint hien tai co hop ly khong.
- Neu thieu breakpoint, them breakpoint phu hop cho mobile, tablet, desktop.

### 2. Header / Navbar

- Tren mobile, chuyen navigation sang menu dang hamburger hoac drawer neu navbar dang qua dai.
- Logo, icon, nut dang nhap/dang xuat khong duoc bi ep hoac mat.
- Menu mobile phai de bam, khoang cach item ro rang.
- Header khong duoc lam tran ngang.
- Neu header fixed/sticky, dam bao khong che noi dung.

### 3. Sidebar

- Neu co sidebar, tren mobile khong de sidebar chiem het chieu ngang.
- Chuyen sidebar thanh drawer/offcanvas hoac collapse.
- Noi dung chinh phai full width tren mobile.
- Khi mo sidebar mobile, co overlay va nut dong ro rang.
- Khong de scroll body bi loi khi sidebar mo.

### 4. Layout chinh

- Chuyen layout nhieu cot thanh mot cot tren mobile.
- Grid, card, list phai tu xuong dong.
- Dung `flex-wrap`, `grid-template-columns`, `minmax`, `auto-fit`, `auto-fill` khi phu hop.
- Tranh dung width co dinh nhu `width: 1200px`, `min-width: 900px`.
- Uu tien `max-width`, `width: 100%`, `box-sizing: border-box`.
- Spacing mobile nho hon desktop nhung van de doc.
- Padding container mobile khoang 12px-16px, tablet 20px-24px, desktop theo layout hien tai.

### 5. Typography

- Font size tren mobile phai de doc.
- Heading qua lon can giam bang `clamp()`.
- Text dai can line-height tot, khoang 1.4-1.7.
- Khong de chu bi cat, de nhau hoac overflow.
- Button text dai can wrap hoac rut gon hop ly.
- Dung responsive typography, vi du:
  - title: `font-size: clamp(1.5rem, 5vw, 3rem)`
  - body: `font-size: clamp(0.95rem, 2vw, 1rem)`

### 6. Button / Form

- Input, select, textarea, button phai full width tren mobile neu can.
- Touch target toi thieu khoang 44px.
- Form nhieu cot chuyen thanh mot cot tren mobile.
- Label, error message, helper text phai ro.
- Nut submit/cancel khong duoc dinh sat nhau.
- Neu co button group, tren mobile chuyen sang stack doc hoac wrap.
- Khong de ban phim mobile che form quan trong neu co modal/form dai.

### 7. Table / Data list

- Neu co table rong, xu ly responsive.
- Co the dung mot trong cac cach:
  - boc table bang container `overflow-x: auto`;
  - chuyen table thanh card list tren mobile;
  - an cot phu it quan trong tren mobile;
  - dung sticky first column neu can.
- Khong de table pha layout toan trang.
- Header/cell text khong duoc chong len nhau.
- Action buttons trong table phai de bam tren mobile.

### 8. Card / Product / Item list

- Card grid desktop nhieu cot, mobile mot cot.
- Khoang cach card deu, khong bi dinh.
- Image trong card dung `width: 100%`, `height: auto` hoac `object-fit: cover`.
- Noi dung card dai can xu ly bang spacing, line clamp neu phu hop.
- Button trong card khong bi vo khi text dai.

### 9. Image / Media

- Anh, video, iframe khong duoc vuot khoi man hinh.
- Them:
  - `max-width: 100%`
  - `height: auto`
  - `object-fit: cover` khi can
- Voi iframe, map, video, dung wrapper co aspect-ratio.
- Tranh set height co dinh lam anh bi meo hoac noi dung bi cat sai.

### 10. Modal / Popup

- Modal mobile phai vua man hinh.
- Width mobile dung gan full width, vi du `width: calc(100vw - 24px)`.
- Modal cao qua thi cho scroll ben trong.
- Nut dong de bam.
- Khong de modal tran ra ngoai man hinh.
- Khi mo modal, background scroll xu ly hop ly.

### 11. Section dai

- Cac phan noi dung dai can chia lai spacing.
- Tren mobile:
  - giam padding top/bottom qua lon;
  - chia block ro rang;
  - tranh de mot hang chua qua nhieu thong tin;
  - dung accordion/collapse neu noi dung qua dai;
  - uu tien hierarchy ro: title -> mo ta -> action -> noi dung phu.
- Noi dung quan trong phai nam truoc, phan phu co the dua xuong duoi.

### 12. CSS can uu tien

- Dung responsive breakpoint ro:
  - mobile: `max-width: 480px`
  - tablet: `max-width: 768px`
  - laptop: `max-width: 1024px`
- Dung `clamp()`, `min()`, `max()` khi hop ly.
- Them global reset neu thieu:
  - `box-sizing: border-box`
  - `img, video { max-width: 100%; height: auto; }`
- Khong lam dung `!important`.
- Khong sua tuy tien logic backend, API, state.

### 13. Kiem tra bug thuong gap

- Trang co horizontal scrollbar.
- Navbar lam vo layout.
- Card bi bop nho.
- Text dai tran khoi container.
- Button qua nho tren mobile.
- Modal vuot chieu rong man hinh.
- Table pha layout.
- Sidebar che het noi dung.
- Form nhieu cot khong xuong dong.
- Section co padding qua lon tren mobile.
- Footer nhieu cot bi chong.
- Dropdown bi cat vi parent `overflow: hidden`.

### 14. Yeu cau kiem thu

- Chay app va kiem tra bang responsive devtools.
- Test cac man hinh:
  - 320x568
  - 360x640
  - 375x667
  - 390x844
  - 414x896
  - 768x1024
  - 1024x768
  - desktop 1366+
- Neu co test/build command, chay build de dam bao khong loi.
- Bao lai file da sua, loi responsive da fix, va cho can kiem tra thu cong.

## Ket qua mong muon

- Giao dien mobile gon, ro, khong tran ngang.
- Desktop van giu duoc bo cuc dep.
- Tablet khong bi layout lung hoac khoang trang xau.
- Tat ca component chinh co responsive tot.
- Code sach, de bao tri, khong pha chuc nang hien tai.

## Cach bat dau

Hay bat dau bang cach doc cau truc project, tim file layout/style chinh, roi sua responsive theo tung nhom component. Sau khi sua xong, chay build/test neu co va tom tat thay doi.

## Prompt rieng cho project Pine-Drink-FE

Ban la senior Angular frontend engineer. Hay sua responsive cho project `Pine-Drink-FE`, Angular + SCSS. Project co 3 layout chinh: `admin-layout`, `client-layout`, `auth-layout`; cac module quan trong gom dashboard, products, categories, branches, toppings, orders, vouchers, reports, permissions, accounts, customers, client home/menu/product detail/profile/address/store locator/promotions/cart.

### Cach doc project truoc khi sua

1. Doc global style:
   - `src/styles.scss`
   - `src/styles/theme-variables.scss`
2. Doc layout:
   - `src/app/layout/admin-layout/admin-layout.component.html`
   - `src/app/layout/admin-layout/admin-layout.component.scss`
   - `src/app/layout/client-layout/client-layout.component.html`
   - `src/app/layout/client-layout/client-layout.component.scss`
   - `src/app/layout/auth-layout/auth-layout.component.html`
   - `src/app/layout/auth-layout/auth-layout.component.scss`
3. Doc cac page admin co table/form/drawer:
   - `src/app/features/products/pages/product-list/product-list.component.*`
   - `src/app/features/products/pages/product-variants-page/product-variants-page.component.*`
   - `src/app/features/products/pages/product-toppings-page/product-toppings-page.component.*`
   - `src/app/features/categories/pages/categories-page/categories-page.component.*`
   - `src/app/features/branches/pages/branches-page/branches-page.component.*`
   - `src/app/features/toppings/pages/toppings-page/toppings-page.component.*`
   - `src/app/features/orders/pages/order-list/order-list.component.*`
   - `src/app/features/accounts/pages/accounts-page/accounts-page.component.*`
   - `src/app/features/permissions/pages/permissions-page/permissions-page.component.*`
4. Doc cac page client:
   - `src/app/features/client/pages/home/home.component.*`
   - `src/app/features/client/pages/menu/menu.component.*`
   - `src/app/features/client/pages/product-detail/product-detail.component.*`
   - `src/app/features/client/pages/profile/profile.component.*`
   - `src/app/features/client/pages/address-list/address-list.component.*`
   - `src/app/features/client/pages/address-form/address-form.component.*`
   - `src/app/features/client/pages/store-locator/store-locator.component.*`
   - `src/app/features/client/components/cart/cart.component.*`

### Chien luoc responsive dung cho project nay

- Khong viet lai UI tu dau. Giu visual Pine Drink hien co: xanh la, vang dua, card glass, gradient, bo goc lon, shadow mem.
- Desktop giu layout hien tai. Chi them/sua breakpoint cho tablet/mobile.
- Breakpoint nen dung:
  - `1180px`: admin table/card toolbar, dashboard metrics, hero admin.
  - `1024px`: admin sidebar thanh drawer, client hero 2 cot thanh 1 cot.
  - `900px`: client menu/home grid lon thanh 1 cot, hero card full width.
  - `760px`: toolbar/filter/action stack doc.
  - `640px`: mobile admin topbar, pagination, form drawer, page padding.
  - `480px`: mobile nho, button full width, heading giam, chip/tab scroll ngang.
- Uu tien component-specific SCSS truoc, chi dung global safeguard trong `src/styles.scss` cho rule chung nhu image/table/input/min-width.
- Khong them `!important` neu co selector component giai quyet duoc.

### Fix admin layout

- `admin-layout` da co co che drawer tai `max-width: 1024px`. Giu co che nay.
- Kiem tra `sidebarOpen`, `.sidebar-backdrop`, `.admin-sidebar` tren mobile:
  - sidebar fixed, width `min(88vw, 304px)`.
  - content main `grid-template-columns: 1fr`.
  - backdrop click dong menu.
  - sidebar `height: 100dvh; overflow-y: auto`.
- `admin-topbar` tren mobile can stack doc, search full width, action icons thanh grid 3 cot.
- `admin-content` mobile dung padding 14px-18px, khong de card cham mep man hinh.
- Delivery mode cung phai responsive giong admin mode.

### Fix admin modules chung

- Cac page admin thuong co pattern: hero/metric cards + toolbar/filter + table/list + drawer/modal + pagination.
- Hero/metric:
  - desktop nhieu cot.
  - tablet 2 cot.
  - mobile 1 cot.
  - heading dung `clamp()`.
- Toolbar/filter:
  - desktop grid nhieu cot.
  - duoi `1180px` chuyen 2 cot hoac 1 cot.
  - duoi `680px` input/select/button full width.
  - search box chiem full row.
- Table/list:
  - Neu table that: boc bang wrapper `overflow-x: auto`, table `min-width: 720px`.
  - Neu row CSS grid nhu branches/products: duoi tablet an `.table-head`, row thanh 2 cot; duoi mobile thanh 1 cot, action canh trai.
  - Nut action can co touch target gan 40-44px.
- Pagination:
  - desktop flex ngang.
  - mobile stack hoac wrap, page size/status/action khong tran.
  - action button khong nho hon 36px, nen 40px tren mobile.
- Drawer/modal:
  - desktop giu width hien tai.
  - mobile `inset: 8px`, `width: auto`, `max-height: calc(100dvh - 16px)`, `overflow-y: auto`.

### Fix module products

- `product-list` co `.studio-hero` 2 cot va `.filter-dock` 5 cot. Da co breakpoint `1180px` ve 1 cot, `760px` metric 1 cot. Kiem tra them:
  - `.hero-panel` tablet nen 2 cot truoc khi ve 1 cot.
  - `.filter-dock` mobile input/select/button full width.
  - product cards/action footer stack doc duoi `760px`.
- `product-variants-page` va `product-toppings-page` nen dung cung pattern: hero -> stats -> filter -> list/table -> drawer. Dong bo breakpoint voi `product-list`.
- `product-form` can form grid 2 cot desktop, 1 cot mobile; upload/image preview khong tran.

### Fix module branches

- `branches-page` co `.branch-hero` 3 cot, `.branch-toolbar` 4 cot, `.branch-row` dang grid.
- Giu breakpoint hien co:
  - `1180px`: `.branch-hero` 1 cot, toolbar 2 cot, an table head, row 2 cot.
  - `680px`: toolbar/field/service/row 1 cot, button full width, drawer inset 8px.
- Can them/kiem tra:
  - `.header-actions` la flex nen mobile can `width: 100%` cho button.
  - `.overview-card.featured` neu qua chat thi stack noi dung va orb xuong duoi.
  - `.pagination-bar` mobile wrap/stack, khong tran.

### Fix module orders

- `order-list` hien dang compact SCSS:
  - `.order-kanban` auto-fit ok.
  - `.filters-form` wrap ok.
  - `.order-card` 5 cot desktop, 2 cot tai `980px`, 1 cot tai `620px`.
- Can dam bao mobile:
  - `.status-select`, `.order-card em`, action button full width neu co.
  - `.order-code` icon khong ep text; text co `min-width: 0` va wrap.
  - filter select width 100% tai mobile.

### Fix client layout va nav

- `client-nav` nam trong `src/styles.scss`, hien mobile dang wrap link/action, chua co hamburger.
- Neu so link qua dai tren 320px, nen chuyen sang:
  - nav links scroll ngang chip row; hoac
  - hamburger/drawer neu co the them state TS.
- Neu khong muon doi logic TS, dung CSS mobile:
  - `.client-nav` wrap.
  - `.nav-links` width 100%, overflow-x auto, white-space nowrap.
  - `.nav-actions` width 100%, justify-content space-between.
  - an text phu trong user chip neu can.
- Footer da co 5 cot -> 2 cot -> 1 cot. Giu va kiem tra spacing mobile.

### Fix client home

- `home` da co hero 2 cot -> 1 cot tai `1024px`.
- Can kiem tra:
  - `.hero-section` mobile padding 1rem-1.25rem, min-height auto.
  - `h1` mobile dung `clamp(2rem, 10vw, 2.5rem)` thay vi fixed neu tran.
  - `.hero-stats` tren 320px nen wrap hoac grid 2 cot.
  - `.quick-order` margin/padding mobile giam, toggle button wrap/full width neu tran.
  - category/product grids minmax mobile khong lon hon viewport.

### Fix client menu/cart

- `menu` da responsive kha tot:
  - hero top 2 cot -> 1 cot tai `900px`.
  - toolbar column tai `760px`.
  - category strip co overflow-x auto.
  - desktop cart sticky, mobile cart fixed bottom hien duoi `1100px`.
- Can kiem tra:
  - `.menu-hero`, `.category-strip` width `calc(100% - 2rem)` mobile ok, 320px co the can `calc(100% - 1rem)`.
  - `.hero-card` width auto mobile.
  - `.sort-buttons` mobile nen scroll ngang hoac button flex 1/full width tuy so luong.
  - `.mobile-cart` left/right 1rem ok, them safe-area neu can: `bottom: max(1rem, env(safe-area-inset-bottom))`.

### Fix auth pages

- Auth pages duoc skin global trong `src/styles.scss` va layout rieng.
- Mobile can:
  - form card width `calc(100vw - 28px)`.
  - input min-height 52px ok.
  - password toggle khong che text.
  - background/visual column neu co an hoac stack.

### Global safeguard nen co

Kiem tra trong `src/styles.scss`, giu hoac them neu thieu:

```scss
*, *::before, *::after { box-sizing: border-box; }

img,
picture,
svg,
video,
canvas {
  max-width: 100%;
}

img,
video {
  height: auto;
  object-fit: cover;
}

button,
input,
select,
textarea {
  max-width: 100%;
}

:where(.admin-content, .client-page, main, section, article, div) {
  min-width: 0;
}

:where(h1, h2, h3, h4, p, a, span, strong, small, td, th, label) {
  overflow-wrap: anywhere;
}
```

### Yeu cau sau khi sua

- Test width: 320, 360, 375, 390, 414, 768, 1024, 1366.
- Khong co horizontal scrollbar global.
- Admin sidebar drawer mo/dong duoc tren mobile.
- Client nav khong tran o 320px.
- Table/list admin khong pha layout.
- Drawer/modal khong tran man hinh.
- Build pass bang `npm run build` neu package co script.

## Prompt ngan hon

```text
Hay audit va sua toan bo responsive frontend cho mobile/tablet/desktop. Uu tien fix loi tran ngang, layout vo, text de nhau, button/input qua nho, table/card/modal/sidebar/navbar khong phu hop tren dien thoai. Giu nguyen logic va chuc nang hien co.

Yeu cau:
- Mobile width 320px-414px phai hien thi tot.
- Khong co horizontal scroll toan trang.
- Layout nhieu cot chuyen thanh mot cot tren mobile.
- Header/navbar chuyen sang hamburger/drawer neu can.
- Sidebar chuyen thanh drawer/collapse tren mobile.
- Table rong dung horizontal scroll hoac card layout.
- Form full width, touch target toi thieu 44px.
- Image/video/iframe khong vuot container.
- Typography dung `clamp()` neu heading qua lon.
- Spacing mobile gon hon desktop.
- Modal vua man hinh va scroll duoc khi noi dung dai.
- Giu style hien tai, khong doi logic API/state/backend.
- Chay build/test neu project co command.
- Sau khi xong, bao file da sua va loi da fix.
```
