import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../../components/header/header';
import { ScrollAnimationDirective } from '../../directives/scroll-animation.directive';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, ScrollAnimationDirective],
  templateUrl: './help.html',
})
export class Help {
  copyright = environment.copyright;

  // State for FAQ accordions
  faqStates: { [key: string]: boolean } = {
    'q1': false,
    'q2': false,
    'q3': false,
    'q4': false
  };

  toggleFaq(id: string) {
    this.faqStates[id] = !this.faqStates[id];
  }

  feedbackSent = false;
  sendFeedback(helpful: boolean) {
    this.feedbackSent = true;
    setTimeout(() => this.feedbackSent = false, 3000);
  }
}
