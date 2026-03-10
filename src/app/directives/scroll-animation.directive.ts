import { 
  Directive, 
  ElementRef, 
  Input, 
  OnInit, 
  OnDestroy,
  Renderer2,
  inject
} from '@angular/core';

@Directive({
  selector: '[appScrollAnimation]',
  standalone: true
})
export class ScrollAnimationDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private observer: IntersectionObserver | null = null;
  private hasAnimated = false;

  @Input() animationType: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-up' = 'fade-up';
  @Input() animationDelay = 0;
  @Input() animationDuration = 600;
  @Input() threshold = 0.1;

  ngOnInit(): void {
    // Set initial styles for animation
    this.setInitialStyles();
    
    // Set up IntersectionObserver
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.hasAnimated) {
            this.hasAnimated = true;
            this.triggerAnimation();
            
            // Stop observing after animation is triggered
            if (this.observer) {
              this.observer.unobserve(this.el.nativeElement);
            }
          }
        });
      },
      {
        threshold: this.threshold,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setInitialStyles(): void {
    const el = this.el.nativeElement as HTMLElement;
    
    // Set CSS custom properties for timing
    el.style.setProperty('--animation-duration', `${this.animationDuration}ms`);
    el.style.setProperty('--animation-delay', `${this.animationDelay}ms`);
    
    // Add animation base class
    this.renderer.addClass(el, 'scroll-animate-item');
    this.renderer.addClass(el, `animate-${this.animationType}`);
    
    // Set initial state (hidden)
    el.style.opacity = '0';
  }

  private triggerAnimation(): void {
    const el = this.el.nativeElement as HTMLElement;
    
    // Small delay if specified
    setTimeout(() => {
      this.renderer.addClass(el, 'animate-active');
    }, this.animationDelay);
  }
}
