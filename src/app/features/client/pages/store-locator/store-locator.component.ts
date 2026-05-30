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

  loading = false;
  
  map!: L.Map;
  markers: L.Marker[] = [];

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
      center: [21.028511, 105.804817], // Hanoi
      zoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
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
        const marker = L.marker([branch.latitude, branch.longitude])
          .addTo(this.map)
          .bindPopup(`<b>${branch.name}</b><br>${branch.address || ''}`)
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
}
