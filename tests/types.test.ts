import { expectType } from 'tsd';

import { SerializedNode } from '../src/types';

expectType<
  {
    type: 'TEXT';
    id: string;
  } & {
    characters: string;
  }
>({} as SerializedNode<TextNode, 'children' | 'characters', false>);
