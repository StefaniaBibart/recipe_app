import { Component, Input, Output, EventEmitter, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css']
})
export class SelectComponent {
  @Input() options: string[] = [];
  @Input() selectedValue: string = '';
  @Input() placeholder: string = '';
  @Output() selectionChange = new EventEmitter<string>();

  searchTerm = signal('');
  isOpen = signal(false);

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isOpen.update(value => !value);
  }

  selectOption(option: string) {
    this.selectedValue = option;
    this.selectionChange.emit(option);
    this.isOpen.set(false);
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    this.selectedValue = '';
    this.selectionChange.emit('');
  }

  filteredOptions() {
    return this.options.filter(option =>
      option.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
} 