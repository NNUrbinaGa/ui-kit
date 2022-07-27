import {
  buildSearchStatus,
  SearchStatus,
  SearchStatusState,
} from '@coveo/headless';
import {Component, h, Listen, State, Element} from '@stencil/core';
import {
  BindStateToController,
  InitializableComponent,
  InitializeBindings,
} from '../../../../utils/initialization-utils';
import {Button} from '../../../common/button';
import {Hidden} from '../../../common/hidden';
import {Bindings} from '../../atomic-search-interface/atomic-search-interface';
import ArrowBottomIcon from 'coveo-styleguide/resources/icons/svg/arrow-bottom-rounded.svg';

@Component({
  tag: 'atomic-popover',
  styleUrl: 'atomic-popover.pcss',
  shadow: true,
})
export class AtomicPopover implements InitializableComponent {
  @InitializeBindings()
  public bindings!: Bindings;
  public searchStatus!: SearchStatus;
  @BindStateToController('searchStatus')
  @State()
  public searchStatusState!: SearchStatusState;
  @State()
  public error!: Error;

  @State() public isMenuVisible = false;
  @State() public facetLabel?: string = 'no-label';
  @Element() host!: HTMLElement;

  public initialize() {
    this.searchStatus = buildSearchStatus(this.bindings.engine);
  }

  renderValueButton() {
    return (
      <Button
        style="square-neutral"
        onClick={() => (this.isMenuVisible = !this.isMenuVisible)}
        class={`value-button rounded flex box-border h-full items-center p-2 group ${
          this.isMenuVisible
            ? 'selected border-primary shadow-inner-primary'
            : 'hover:border-primary-light focus-visible:border-primary-light'
        }`}
      >
        {this.facetLabel}
        <atomic-icon class="w-2.5 ml-2" icon={ArrowBottomIcon}></atomic-icon>
      </Button>
    );
  }

  @Listen('facetInitialized')
  injectPopoverClass(event: CustomEvent) {
    if (!event.detail.element.shadowRoot) {
      return;
    }

    const facetContainer =
      event.detail.element.shadowRoot.querySelector('[part="facet"]');

    if (!facetContainer) {
      return;
    }

    this.facetLabel = event.detail.label;

    facetContainer.setAttribute(
      'class',
      facetContainer.className + ' popover-nested'
    );
  }

  @Listen('focusout')
  hidePopoverMenu() {
    if (!this.host.shadowRoot!.contains(document.activeElement)) {
      console.log(
        'element contains no focused children',
        document.activeElement
      );
      this.isMenuVisible = false;
    }
  }

  render() {
    if (this.searchStatus.state.hasError) {
      return <Hidden></Hidden>;
    }

    //return error if popover has more than 1 child

    //hide if facet has 0 values

    return (
      <div part="popover-wrapper" class="popover-wrapper relative">
        {this.renderValueButton()}
        <div
          tabindex="0"
          class={`slot-wrapper absolute top-10 z-10 hidden ${
            this.isMenuVisible ? 'selected' : ''
          }`}
        >
          <slot></slot>
        </div>
      </div>
    );
  }
}
