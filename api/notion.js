export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  const NOTION_TOKEN = 'ntn_194364271133biC3ygakFWeD0fPxcztSZoHVJuhPCSRka7T';
  const PAGE_ID = '2ed48680577d8069a2d2da77a2677168';

  try {
    const blocksResponse = await fetch(
      `https://api.notion.com/v1/blocks/${PAGE_ID}/children`,
      {
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
        }
      }
    );
    
    if (!blocksResponse.ok) {
      const error = await blocksResponse.json();
      return res.status(blocksResponse.status).json(error);
    }
    
    const blocksData = await blocksResponse.json();
    
    let text = '';
    blocksData.results.forEach(block => {
      if (block.type === 'paragraph' && block.paragraph.rich_text) {
        text += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\n\n';
      } else if (block.type === 'heading_1' && block.heading_1.rich_text) {
        text += block.heading_1.rich_text.map(t => t.plain_text).join('') + '\n\n';
      } else if (block.type === 'heading_2' && block.heading_2.rich_text) {
        text += block.heading_2.rich_text.map(t => t.plain_text).join('') + '\n\n';
      } else if (block.type === 'heading_3' && block.heading_3.rich_text) {
        text += block.heading_3.rich_text.map(t => t.plain_text).join('') + '\n\n';
      } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item.rich_text) {
        text += '• ' + block.bulleted_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
      } else if (block.type === 'numbered_list_item' && block.numbered_list_item.rich_text) {
        text += block.numbered_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
      }
    });
    
    res.status(200).json({ content: text.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
