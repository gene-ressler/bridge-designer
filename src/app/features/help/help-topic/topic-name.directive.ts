import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Workaround for TemplateRef providing no access to injection tag.
 *
 * Usage: <ng-template template-name="foo">...</ng-template>
 * 
 * Then this.name will contain 'foo' and this.templateRef will point to the template.
 */
@Directive({
  selector: '[topic-name]',
  standalone: true,
})
export class TopicNameDirective {
  constructor(public readonly templateRef: TemplateRef<any>) {}
  @Input('topic-name') name!: string;
}
