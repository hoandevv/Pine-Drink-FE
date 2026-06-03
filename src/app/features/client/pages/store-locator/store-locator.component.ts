import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import * as L from 'leaflet';
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
      filtered = filtered.filter((branch) => branch.status === 'ACTIVE');
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
    return branch.status === 'ACTIVE' ? 'open' : 'closed';
  }

  getStatusText(branch: Branch): string {
    return branch.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng';
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

  private branchPopup(branch: Branch): string {
    return `
      <div class="pine-popup-card">
        <strong>${branch.name}</strong>
        <p>${branch.address || 'Chưa cập nhật địa chỉ'}</p>
        <span>${this.getPreparationText(branch)}</span>
      </div>
    `;
  }
}
