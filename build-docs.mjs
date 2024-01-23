import * as fs from 'fs';

const tempDocsDir = './docs-temp';
const title = '# figma-plugin-react-hooks';
const typeTitle = '## Type Aliases';
const newTypeTitle = '## Types';

const files = fs.readdirSync(tempDocsDir);
const mdFiles = files.filter((file) => file.endsWith('.md'));

const mdFilesContent = mdFiles.map((file) => {
  let content = fs.readFileSync(`${tempDocsDir}/${file}`, 'utf8');
  content = content.replace(title, '').trim();
  content = content.replace(typeTitle, newTypeTitle).trim();
  return content;
});

fs.writeFileSync('./README.md', `${title}\n\n${mdFilesContent.join('\n\n')}\n`);
