import { Component, Input, Output, EventEmitter, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-multiselect',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.css']
})
export class MultiselectComponent {
  @Input() options: string[] = [];
  @Input() selectedValues: string[] = [];
  @Output() selectionChange = new EventEmitter<string[]>();

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

  toggleOption(option: string) {
    const currentSelection = [...this.selectedValues];
    const index = currentSelection.indexOf(option);
    
    if (index === -1) {
      currentSelection.push(option);
    } else {
      currentSelection.splice(index, 1);
    }
    
    this.selectionChange.emit(currentSelection);
  }

  removeOption(option: string, event: Event) {
    event.stopPropagation();
    const currentSelection = this.selectedValues.filter(item => item !== option);
    this.selectionChange.emit(currentSelection);
  }

  isSelected(option: string): boolean {
    return this.selectedValues.includes(option);
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