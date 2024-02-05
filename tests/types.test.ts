import { expectType } from 'tsd';

import { KeysOfUnion, SerializedNode } from '../src/types';

expectType<
  {
    type: 'TEXT';
    id: string;
  } & {
    characters: string;
  }
>({} as SerializedNode<TextNode, 'children' | 'characters', false>);

expectType<'a' | 'b' | 'c'>({} as KeysOfUnion<{ a: 1; b: 2 } | { b: 2; c: 3 }>);
