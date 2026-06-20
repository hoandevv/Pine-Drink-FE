import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { Branch } from '../../../branches/models/branch.model';
import { BranchService } from '../../../branches/services/branch.service';
import { Product } from '../../models/product.model';
import { ProductVariant } from '../../models/product-variant.model';
import { DailyStock, DailyStockLog } from '../../models/daily-stock.model';
import { DailyStockService } from '../../services/daily-stock.service';
import { ProductService } from '../../services/product.service';
import { ProductVariantService } from '../../services/product-variant.service';

interface VariantOption extends ProductVariant { productId: string; productName: string; }

@Component({
  selector: 'app-daily-stocks-page',
  templateUrl: './daily-stocks-page.component.html',
  styleUrls: ['./daily-stocks-page.component.scss']
})
export class DailyStocksPageComponent implements OnInit {
  readonly quotaForm = this.formBuilder.nonNullable.group({
    variantId: ['', Validators.required],
    dailyQuantity: [0, [Validators.required, Validators.min(0)]],
    reason: ['Set quota đầu ngày', [Validators.maxLength(255)]]
  });

  readonly copyForm = this.formBuilder.nonNullable.group({
    sourceDate: [this.toDateInput(this.addDays(new Date(), -1)), Validators.required],
    overwrite: [false],
    reason: ['Copy quota from previous day', [Validators.maxLength(255)]]
  });

  branches: Branch[] = [];
  products: Product[] = [];
  variants: VariantOption[] = [];
  stocks: DailyStock[] = [];
  logs: DailyStockLog[] = [];
  selectedBranchId = '';
  selectedDate = this.toDateInput(new Date());
  selectedStock: DailyStock | null = null;
  loading = false;
  saving = false;
  bootLoading = false;
  logLoading = false;
  drawerOpen = false;
  copyOpen = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly branchService: BranchService,
    private readonly productService: ProductService,
    private readonly variantService: ProductVariantService,
    private readonly dailyStockService: DailyStockService
  ) {}

  ngOnInit(): void { this.loadInitialData(); }

  get totalQuota(): number { return this.stocks.reduce((sum, stock) => sum + (stock.dailyQuantity || 0), 0); }
  get totalAvailable(): number { return this.stocks.reduce((sum, stock) => sum + (stock.availableQuantity || 0), 0); }
  get totalReserved(): number { return this.stocks.reduce((sum, stock) => sum + (stock.reservedQuantity || 0), 0); }
  get totalSold(): number { return this.stocks.reduce((sum, stock) => sum + (stock.soldQuantity || 0), 0); }
  get selectedBranch(): Branch | undefined { return this.branches.find((branch) => branch.id === this.selectedBranchId); }

  onBranchChange(branchId: string): void { this.selectedBranchId = branchId; this.loadStocks(); }
  onDateChange(date: string): void { this.selectedDate = date; this.loadStocks(); }
  refresh(): void { this.loadStocks(); }

  openCreateDrawer(): void {
    this.selectedStock = null;
    this.quotaForm.reset({ variantId: '', dailyQuantity: 0, reason: 'Set quota đầu ngày' });
    this.drawerOpen = true;
  }

  openEditDrawer(stock: DailyStock): void {
    this.selectedStock = stock;
    this.quotaForm.reset({
      variantId: stock.variantId,
      dailyQuantity: stock.dailyQuantity || 0,
      reason: 'Điều chỉnh quota trong ngày'
    });
    this.drawerOpen = true;
    this.loadLogs(stock);
  }

  closeDrawer(): void { if (!this.saving) { this.drawerOpen = false; this.selectedStock = null; } }
  openCopyPanel(): void { this.copyOpen = true; }
  closeCopyPanel(): void { if (!this.saving) { this.copyOpen = false; } }

  saveQuota(): void {
    if (!this.selectedBranchId || this.quotaForm.invalid) { this.quotaForm.markAllAsTouched(); return; }
    const value = this.quotaForm.getRawValue();
    this.saving = true;
    this.clearMessages();

    const request$ = this.selectedStock
      ? this.dailyStockService.updateQuota(this.selectedStock.id, { dailyQuantity: value.dailyQuantity, reason: value.reason })
      : this.dailyStockService.setQuota({
          branchId: this.selectedBranchId,
          variantId: value.variantId,
          stockDate: this.selectedDate,
          dailyQuantity: value.dailyQuantity,
          reason: value.reason
        });

    request$.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => { this.successMessage = 'Đã lưu quota tồn kho ngày.'; this.drawerOpen = false; this.loadStocks(); },
      error: (error) => {
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Không lưu được quota. Kiểm tra số lượng >= sold + reserved hoặc quyền thao tác.'
        );
      }
    });
  }

  copyQuota(): void {
    if (!this.selectedBranchId || this.copyForm.invalid) { this.copyForm.markAllAsTouched(); return; }
    const value = this.copyForm.getRawValue();
    this.saving = true;
    this.clearMessages();
    this.dailyStockService.copyQuota({
      branchId: this.selectedBranchId,
      sourceDate: value.sourceDate,
      targetDate: this.selectedDate,
      overwrite: value.overwrite,
      reason: value.reason
    }).pipe(finalize(() => (this.saving = false))).subscribe({
      next: (result) => {
        this.successMessage = `Copy xong: tạo ${result.createdCount}, cập nhật ${result.updatedCount}, bỏ qua ${result.skippedCount}.`;
        this.copyOpen = false;
        this.loadStocks();
      },
      error: (error) => {
        this.errorMessage = this.resolveErrorMessage(
          error,
          'Không copy được quota. Kiểm tra ngày nguồn hoặc rule overwrite.'
        );
      }
    });
  }

  variantLabel(variantId: string): string {
    const variant = this.variants.find((item) => item.id === variantId);
    return variant ? `${variant.productName} · ${variant.variantName}` : 'Biến thể không xác định';
  }

  stockStatusLabel(stock: DailyStock): string {
    if ((stock.availableQuantity || 0) <= 0) { return 'Hết hàng'; }
    if ((stock.availableQuantity || 0) <= 5) { return 'Sắp hết'; }
    return 'Còn bán';
  }

  trackStock(_: number, stock: DailyStock): string { return stock.id; }
  trackVariant(_: number, variant: VariantOption): string { return variant.id; }
  trackBranch(_: number, branch: Branch): string { return branch.id; }
  trackLog(_: number, log: DailyStockLog): string { return log.id; }

  private loadInitialData(): void {
    this.bootLoading = true;
    this.clearMessages();
    forkJoin({
      branches: this.branchService.getActiveBranches(0, 100),
      products: this.productService.getProducts(0, 100)
    }).pipe(finalize(() => (this.bootLoading = false))).subscribe({
      next: ({ branches, products }) => {
        this.branches = branches.content || [];
        this.products = products.content || [];
        this.selectedBranchId = this.branches[0]?.id || '';
        this.loadAllVariants();
        if (this.selectedBranchId) { this.loadStocks(); }
      },
      error: () => { this.errorMessage = 'Không tải được dữ liệu chi nhánh/sản phẩm.'; }
    });
  }

  private loadAllVariants(): void {
    if (!this.products.length) { this.variants = []; return; }
    forkJoin(this.products.map((product) => this.variantService.getActiveVariants(product.id))).subscribe({
      next: (groups) => {
        this.variants = groups.flatMap((items, index) => items.map((variant) => ({
          ...variant,
          productId: this.products[index].id,
          productName: this.products[index].name
        })));
      },
      error: () => { this.variants = []; }
    });
  }

  private loadStocks(): void {
    if (!this.selectedBranchId) { this.stocks = []; return; }
    this.loading = true;
    this.clearMessages(false);
    this.dailyStockService.getByBranchAndDate(this.selectedBranchId, this.selectedDate)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (stocks) => { this.stocks = stocks || []; },
        error: () => { this.stocks = []; this.errorMessage = 'Không tải được daily stock.'; }
      });
  }

  private loadLogs(stock: DailyStock): void {
    this.logLoading = true;
    this.logs = [];
    this.dailyStockService.getLogs(stock.id, 0, 20)
      .pipe(finalize(() => (this.logLoading = false)))
      .subscribe({ next: (page) => { this.logs = page.content || []; }, error: () => { this.logs = []; } });
  }

  private clearMessages(clearSuccess = true): void { this.errorMessage = ''; if (clearSuccess) { this.successMessage = ''; } }
  private addDays(date: Date, days: number): Date { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
  private toDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private resolveErrorMessage(error: any, fallback: string): string {
    return error?.error?.message || error?.error?.errorMessage || error?.message || fallback;
  }
}
