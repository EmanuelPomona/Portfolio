// Owner: agent/stickman. TASK-202. Default targets and data-stickman opt-outs (docs/API.md §2.3).
import { afterEach, describe, expect, it } from 'vitest';
import { findTarget } from './targets';

function mount(html: string) {
  document.body.innerHTML = html;
  return (id: string) => document.getElementById(id);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('findTarget honours default selectors and data-stickman ignore/target', () => {
  it('matches a link with an href, from the link or anything inside it', () => {
    const $ = mount('<a id="a" href="/x"><span id="inner"><b id="deep">go</b></span></a>');
    expect(findTarget($('a'))).toBe($('a'));
    expect(findTarget($('deep'))).toBe($('a'));
  });

  it('ignores an anchor without an href', () => {
    const $ = mount('<a id="a"><span id="in">not a link</span></a>');
    expect(findTarget($('in'))).toBeNull();
  });

  it('matches an enabled button but not a disabled one', () => {
    const $ = mount('<button id="on">ok</button><button id="off" disabled><i id="icon">x</i></button>');
    expect(findTarget($('on'))).toBe($('on'));
    expect(findTarget($('icon'))).toBeNull();
  });

  it('matches anything marked data-stickman="target"', () => {
    const $ = mount('<div id="card" data-stickman="target"><p id="p">photo</p></div>');
    expect(findTarget($('p'))).toBe($('card'));
  });

  it('returns the nearest target when they nest', () => {
    const $ = mount('<div data-stickman="target"><a id="a" href="#k"><span id="s">k</span></a></div>');
    expect(findTarget($('s'))).toBe($('a'));
  });

  it('returns null for anything inside data-stickman="ignore", even a target', () => {
    const $ = mount(
      '<div data-stickman="ignore"><a id="a" href="/x">x</a><div id="t" data-stickman="target"></div></div>',
    );
    expect(findTarget($('a'))).toBeNull();
    expect(findTarget($('t'))).toBeNull();
  });

  it('returns null for plain content and for null', () => {
    const $ = mount('<p id="p">text</p>');
    expect(findTarget($('p'))).toBeNull();
    expect(findTarget(null)).toBeNull();
  });

  it('works for SVG content inside a link', () => {
    const $ = mount('<a id="a" href="/x"><svg><path id="path" d="M0 0"/></svg></a>');
    expect(findTarget($('path'))).toBe($('a'));
  });
});
