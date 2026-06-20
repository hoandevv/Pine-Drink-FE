# Pine Drink Admin UI Guide

Tài liệu chuẩn format giao diện admin Pine Drink. Khi làm module mới hoặc chỉnh module cũ, ưu tiên dùng chuẩn này để tránh lệch UI.

## Hero typography chuẩn

Dùng cho phần headline và mô tả đầu trang của các module admin: Category, Product, Topping Master, Product Variant, Product Topping Studio, Account...

### HTML pattern

```html
<h1>Danh mục gọn, menu dễ đọc, thao tác nhanh.</h1>
<p>Quản lý ảnh đại diện, mô tả ngắn, thứ tự ưu tiên và trạng thái hiển thị cho từng nhóm đồ uống.</p>
```

### SCSS chuẩn

```scss
.hero-copy h1,
.master-hero h1,
h1 {
  margin: 0 0 8px;
  max-width: 620px;
  color: #064e3b;
  font-size: 28px;
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-weight: 900;
}

.hero-copy p,
.master-hero p,
p {
  max-width: 620px;
  margin: 0 0 20px;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
}
```

## Copywriting rule

- Headline ngắn, 1 câu, có dấu chấm cuối câu.
- Mô tả 1 câu, nói rõ đối tượng quản lý và thao tác chính.
- Không dùng đoạn mô tả quá dài trong hero.
- Không lặp cùng ý nhiều lần giữa module cha và module con.

## Ví dụ copy đúng format

### Category

```html
<h1>Danh mục gọn, menu dễ đọc, thao tác nhanh.</h1>
<p>Quản lý ảnh đại diện, mô tả ngắn, thứ tự ưu tiên và trạng thái hiển thị cho từng nhóm đồ uống.</p>
```

### Product

```html
<h1>Sản phẩm gọn, giá rõ, menu dễ điều phối.</h1>
<p>Quản lý trạng thái bán, danh mục, giá và thông tin hiển thị cho từng món Pine Drink trong một workspace trực quan.</p>
```

### Topping Master

```html
<h1>Kho topping</h1>
<p>Quản lý topping gốc dùng để gắn vào sản phẩm.</p>
```

### Product Variant

```html
<h1>Biến thể rõ, giá cộng thêm chuẩn, menu linh hoạt.</h1>
<p>Quản lý size, tên biến thể, mức giá cộng thêm và thứ tự hiển thị theo từng sản phẩm Pine Drink.</p>
```

### Product Topping Studio

```html
<h1>Topping theo món, mặc định rõ, số lượng dễ kiểm soát.</h1>
<p>Chọn sản phẩm, lấy topping active từ kho master và cấu hình option bán kèm đúng chuẩn Pine Drink.</p>
```
