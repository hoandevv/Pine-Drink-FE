import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, finalize, of } from 'rxjs';

import * as L from 'leaflet';
import { BranchHours } from '../../../branches/models/branch-hours.model';
import { Branch } from '../../../branches/models/branch.model';
import { BranchService } from '../../../branches/services/branch.service';

@Component({
  selector: 'app-store-locator',
  templateUrl: './store-locator.component.html',
  styleUrls: ['./store-locator.component.scss']
})
export class StoreLocatorComponent implements OnInit {
  allBranches: Branch[] = [];
  filteredBranches: Branch[] = [];
  selectedBranch: Branch | null = null;
  userLocation: L.LatLngLiteral | null = null;
  branchHoursByBranchId: Record<string, BranchHours[]> = {};
  expandedHoursBranchId: string | null = null;

  loading = false;
  
  map!: L.Map;
  markers: L.Marker[] = [];
  userLocationMarker: L.Marker | null = null;
  private tileLayers: Record<string, L.TileLayer> = {};
  private branchIcon!: L.Icon;
  private selectedBranchIcon!: L.Icon;
  activeMapMode: 'street' | 'satellite' | 'light' | 'dark' = 'street';

  searchQuery = '';
  filterNearby = false;
  filterOpen = false;
  filterPickup = false;
  filterDelivery = false;

  constructor(
    private readonly router: Router,
    private readonly branchService: BranchService
  ) {}

  ngOnInit(): void {
    this.initMap();
    this.loadBranches();
  }

  private initMap(): void {
    this.map = L.map('store-locator-map', {
      center: [21.028511, 105.804817],
      zoom: 12,
      zoomControl: false
    });

    this.tileLayers = {
      street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles © Esri'
      }),
      light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap © CARTO'
      }),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '© OpenStreetMap © CARTO'
      })
    };

    this.tileLayers[this.activeMapMode].addTo(this.map);
    this.configureMarkerIcons();
  }

  loadBranches(): void {
    this.loading = true;
    this.branchService
      .getActiveBranches(0, 100)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pageData) => {
          this.allBranches = pageData.content;
          this.applyFilters();
          this.selectedBranch = this.filteredBranches[0] || null;
          this.loadBranchHours(this.allBranches);
        },
        error: () => {
          this.allBranches = [];
          this.filteredBranches = [];
          this.selectedBranch = null;
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.allBranches];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter((branch) =>
        branch.name.toLowerCase().includes(query) ||
        (branch.address || '').toLowerCase().includes(query) ||
        (branch.phone || '').toLowerCase().includes(query) ||
        (branch.email || '').toLowerCase().includes(query)
      );
    }

    if (this.filterOpen) {
      filtered = filtered.filter((branch) => this.getOperatingState(branch).status === 'open');
    }

    if (this.filterPickup) {
      filtered = filtered.filter((branch) => branch.supportsPickup);
    }

    if (this.filterDelivery) {
      filtered = filtered.filter((branch) => branch.supportsDelivery);
    }

    if (this.filterNearby && this.userLocation) {
      filtered = filtered
        .filter((branch) => branch.latitude && branch.longitude)
        .sort((a, b) => this.distanceToBranch(a) - this.distanceToBranch(b));
    }

    this.filteredBranches = filtered;
    this.updateMapMarkers();

    if (this.selectedBranch && !filtered.some((branch) => branch.id === this.selectedBranch?.id)) {
      this.selectedBranch = filtered[0] || null;
      if (this.selectedBranch) {
        this.selectBranch(this.selectedBranch);
      }
    }
  }

  private updateMapMarkers(): void {
    if (!this.map) return;

    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    const bounds = L.latLngBounds([]);

    this.filteredBranches.forEach(branch => {
      if (branch.latitude && branch.longitude) {
        const marker = L.marker([branch.latitude, branch.longitude], { icon: this.getBranchIcon(branch) })
          .addTo(this.map)
          .bindPopup(this.branchPopup(branch), { className: 'pine-map-popup' })
          .on('click', () => {
            this.selectBranch(branch);
          });
        this.markers.push(marker);
        bounds.extend([branch.latitude, branch.longitude]);
      }
    });

    if (this.markers.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  toggleFilter(filterName: 'nearby' | 'open' | 'pickup' | 'delivery'): void {
    switch (filterName) {
      case 'nearby':
        this.filterNearby = !this.filterNearby;
        if (this.filterNearby && !this.userLocation) {
          this.locateUser(true);
          return;
        }
        break;
      case 'open':
        this.filterOpen = !this.filterOpen;
        break;
      case 'pickup':
        this.filterPickup = !this.filterPickup;
        break;
      case 'delivery':
        this.filterDelivery = !this.filterDelivery;
        break;
    }
    this.applyFilters();
  }

  selectBranch(branch: Branch): void {
    this.selectedBranch = branch;
    if (branch.latitude && branch.longitude && this.map) {
      this.map.setView([branch.latitude, branch.longitude], 15, { animate: true });
    }
  }

  confirmBranch(branch: Branch): void {
    sessionStorage.setItem('selectedBranchId', branch.id);
    sessionStorage.setItem('selectedBranchName', branch.name);
    this.router.navigate(['/menu']);
  }

  getStatusClass(branch: Branch): string {
    return this.getOperatingState(branch).status;
  }

  getStatusText(branch: Branch): string {
    return this.getOperatingState(branch).label;
  }

  getTodayHoursLabel(branch: Branch): string {
    const todayHours = this.getTodayHours(branch);

    if (!todayHours) {
      return 'Chưa có lịch hôm nay';
    }

    if (todayHours.closed) {
      return 'Hôm nay nghỉ';
    }

    return `Hôm nay: ${this.formatTime(todayHours.openTime)} - ${this.formatTime(todayHours.closeTime)}`;
  }

  toggleHours(branch: Branch, event: Event): void {
    event.stopPropagation();
    this.expandedHoursBranchId = this.expandedHoursBranchId === branch.id ? null : branch.id;
  }

  isHoursExpanded(branch: Branch): boolean {
    return this.expandedHoursBranchId === branch.id;
  }

  getWeeklyHours(branch: Branch): BranchHours[] {
    return [...(this.branchHoursByBranchId[branch.id] ?? [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  getDayLabel(dayOfWeek: number): string {
    const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return labels[dayOfWeek] ?? `T${dayOfWeek}`;
  }

  getHoursRangeLabel(hours: BranchHours): string {
    return hours.closed ? 'Nghỉ' : `${this.formatTime(hours.openTime)} - ${this.formatTime(hours.closeTime)}`;
  }

  isToday(hours: BranchHours): boolean {
    return hours.dayOfWeek === new Date().getDay();
  }

  getPreparationText(branch: Branch): string {
    const minutes = branch.averagePreparationMinutes || 15;
    return `${minutes} phút`;
  }

  setMapMode(mode: 'street' | 'satellite' | 'light' | 'dark'): void {
    if (!this.map || this.activeMapMode === mode) { return; }

    Object.values(this.tileLayers).forEach(layer => this.map.removeLayer(layer));
    this.tileLayers[mode].addTo(this.map);
    this.activeMapMode = mode;
  }

  zoomIn(): void {
    this.map?.zoomIn();
  }

  zoomOut(): void {
    this.map?.zoomOut();
  }

  resetMapView(): void {
    this.updateMapMarkers();
  }

  locateUser(applyNearby = false): void {
    if (!navigator.geolocation || !this.map) { return; }

    navigator.geolocation.getCurrentPosition(position => {
      this.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      const latLng: L.LatLngExpression = [this.userLocation.lat, this.userLocation.lng];

      if (this.userLocationMarker) {
        this.map.removeLayer(this.userLocationMarker);
      }

      this.userLocationMarker = L.marker(latLng, { icon: this.createUserIcon() })
        .addTo(this.map)
        .bindPopup('Vị trí của bạn');
      this.map.setView(latLng, 15, { animate: true });

      if (applyNearby || this.filterNearby) {
        this.applyFilters();
      }
    });
  }

  distanceLabel(branch: Branch): string {
    if (!this.userLocation || !branch.latitude || !branch.longitude) {
      return 'Pine Drink';
    }

    const distance = this.distanceToBranch(branch);
    return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
  }

  private distanceToBranch(branch: Branch): number {
    if (!this.userLocation || !branch.latitude || !branch.longitude) {
      return Number.POSITIVE_INFINITY;
    }

    const earthRadiusKm = 6371;
    const dLat = this.toRadians(branch.latitude - this.userLocation.lat);
    const dLng = this.toRadians(branch.longitude - this.userLocation.lng);
    const userLat = this.toRadians(this.userLocation.lat);
    const branchLat = this.toRadians(branch.latitude);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(userLat) * Math.cos(branchLat) * Math.sin(dLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRadians(value: number): number {
    return value * Math.PI / 180;
  }

  private configureMarkerIcons(): void {
    this.branchIcon = L.icon({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    this.selectedBranchIcon = L.icon({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
      iconSize: [30, 49],
      iconAnchor: [15, 49],
      popupAnchor: [1, -42],
      tooltipAnchor: [16, -32],
      shadowSize: [45, 45]
    });

    L.Marker.prototype.options.icon = this.branchIcon;
  }

  private getBranchIcon(branch: Branch): L.Icon {
    return this.selectedBranch?.id === branch.id ? this.selectedBranchIcon : this.branchIcon;
  }

  private createUserIcon(): L.DivIcon {
    return L.divIcon({
      className: 'pine-user-marker',
      html: '<span class="material-symbols-outlined">near_me</span>',
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });
  }

  private loadBranchHours(branches: Branch[]): void {
    if (!branches.length) {
      this.branchHoursByBranchId = {};
      return;
    }

    const requests = branches.map((branch) =>
      this.branchService.getBranchHours(branch.id).pipe(
        catchError(() => of([] as BranchHours[]))
      )
    );

    forkJoin(requests.length ? requests : [of([] as BranchHours[])]).subscribe({
      next: (hoursGroups) => {
        this.branchHoursByBranchId = branches.reduce<Record<string, BranchHours[]>>((acc, branch, index) => {
          acc[branch.id] = hoursGroups[index] ?? [];
          return acc;
        }, {});
        this.applyFilters();
      },
      error: () => {
        this.branchHoursByBranchId = {};
      }
    });
  }

  private getTodayHours(branch: Branch): BranchHours | null {
    const today = new Date().getDay();
    return this.getWeeklyHours(branch).find((hours) => hours.dayOfWeek === today) ?? null;
  }

  private getOperatingState(branch: Branch): { status: 'open' | 'closing-soon' | 'closed' | 'unknown'; label: string } {
    if (branch.status !== 'ACTIVE') {
      return { status: 'closed', label: 'Tạm ngưng' };
    }

    const todayHours = this.getTodayHours(branch);
    if (!todayHours) {
      return { status: 'unknown', label: 'Chưa có lịch' };
    }

    if (todayHours.closed) {
      return { status: 'closed', label: this.getNextOpeningLabel(branch) };
    }

    const now = new Date();
    const openAt = this.timeToDate(todayHours.openTime, now);
    const closeAt = this.timeToDate(todayHours.closeTime, now);

    if (now >= openAt && now <= closeAt) {
      const minutesToClose = Math.round((closeAt.getTime() - now.getTime()) / 60000);
      if (minutesToClose <= 45) {
        return { status: 'closing-soon', label: `Sắp đóng · còn ${minutesToClose} phút` };
      }

      return { status: 'open', label: `Đang mở · đóng lúc ${this.formatTime(todayHours.closeTime)}` };
    }

    if (now < openAt) {
      return { status: 'closed', label: `Chưa mở · mở lúc ${this.formatTime(todayHours.openTime)}` };
    }

    return { status: 'closed', label: this.getNextOpeningLabel(branch) };
  }

  private getNextOpeningLabel(branch: Branch): string {
    const weeklyHours = this.getWeeklyHours(branch);
    const today = new Date().getDay();

    for (let offset = 1; offset <= 7; offset++) {
      const day = (today + offset) % 7;
      const nextHours = weeklyHours.find((hours) => hours.dayOfWeek === day && !hours.closed);
      if (nextHours) {
        const dayLabel = offset === 1 ? 'mai' : this.getDayLabel(day);
        return `Đã đóng · mở ${dayLabel} ${this.formatTime(nextHours.openTime)}`;
      }
    }

    return 'Đã đóng';
  }

  private timeToDate(time: string, baseDate: Date): Date {
    const [hour = 0, minute = 0] = time.split(':').map(Number);
    const next = new Date(baseDate);
    next.setHours(hour, minute, 0, 0);
    return next;
  }

  private formatTime(time: string): string {
    return time?.slice(0, 5) || '--:--';
  }

  private branchPopup(branch: Branch): string {
    const status = this.getOperatingState(branch);

    return `
      <div class="pine-popup-card">
        <strong>${branch.name}</strong>
        <p>${branch.address || 'Chưa cập nhật địa chỉ'}</p>
        <span class="popup-status ${status.status}">${status.label}</span>
        <small>${this.getTodayHoursLabel(branch)}</small>
      </div>
    `;
  }
}
