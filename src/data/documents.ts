import { generateMockEmbedding } from '../lib/semanticSearch';

export interface Document {
  id: string;
  title: string;
  content: string;
  category: 'technology' | 'science' | 'finance' | 'lifestyle';
  url: string;
  snippet: string;
  date: string;
  embedding?: number[];
}

export const documents: Document[] = [
  {
    id: '1',
    title: 'Implementing Semantic Search with Vector Embeddings',
    content: 'Semantic search is a data retrieval method that uses the intent and contextual meaning of search patterns to provide more relevant results. Unlike keyword-based search, semantic search uses vector embeddings to map text into a high-dimensional space where similar meanings are geographically close.',
    category: 'technology',
    url: 'https://example.com/semantic-search',
    snippet: 'Learn how vector embeddings revolutionize retrieval by understanding context instead of just keywords.',
    date: '2024-03-15'
  },
  {
    id: '2',
    title: 'The Future of Quantum Computing in 2025',
    content: 'Quantum computing is moving beyond theoretical research into practical applications. Recent breakthroughs in error correction and qubit stability are paving the way for revolutionary changes in cryptography, material science, and pharmaceutical research.',
    category: 'science',
    url: 'https://example.com/quantum-future',
    snippet: 'Practical quantum computing is closer than ever, with major impacts expected in cryptography and science.',
    date: '2024-03-20'
  },
  {
    id: '3',
    title: 'Sustainable Investing: A New Era for Finance',
    content: 'Environmental, Social, and Governance (ESG) criteria are increasingly becoming central to investment strategies. Sustainable finance aims to direct capital toward companies that prioritize long-term ecological and social responsibility alongside financial returns.',
    category: 'finance',
    url: 'https://example.com/sustainable-finance',
    snippet: 'ESG criteria are reshaping the financial landscape as investors prioritize sustainability.',
    date: '2024-03-22'
  },
  {
    id: '4',
    title: 'Effective Remote Work Management Strategies',
    content: 'Managing a distributed team requires new approaches to communication and trust. Tools like Slack, Zoom, and Notion are essential, but the real key lies in asynchronous communication and clear documentation.',
    category: 'lifestyle',
    url: 'https://example.com/remote-work',
    snippet: 'Communication and documentation are the pillars of successful remote team management.',
    date: '2024-03-25'
  },
  {
    id: '5',
    title: 'Artificial Intelligence in Modern Healthcare',
    content: 'AI is transforming diagnosis and treatment planning. Machine learning models can analyze medical images with higher accuracy than humans, and predictive analytics are helping hospitals manage patient flow more efficiently.',
    category: 'technology',
    url: 'https://example.com/ai-healthcare',
    snippet: 'From image analysis to predictive logistics, AI is becoming a vital part of healthcare.',
    date: '2024-04-01'
  },
  {
    id: '6',
    title: 'The Rise of Electric Vehicles and Charging Infrastructure',
    content: 'As EV adoption grows, the infrastructure behind it must keep pace. Fast-charging stations and smart grid integration are critical components for the widespread success of electric transportation.',
    category: 'technology',
    url: 'https://example.com/ev-infrastructure',
    snippet: 'Growth in electric vehicle adoption depends heavily on the expansion of charging networks.',
    date: '2024-04-05'
  },
  {
    id: '7',
    title: 'Urban Farming: The Secret to Food Security',
    content: 'Vertical farms and community gardens are appearing in skyscrapers and abandoned lots. These urban agriculture projects reduce food miles and provide fresh produce to city dwellers, improving local food security.',
    category: 'lifestyle',
    url: 'https://example.com/urban-farming',
    snippet: 'Vertical farming and community gardens are bringing agriculture into the heart of the city.',
    date: '2024-04-10'
  },
  {
    id: '8',
    title: 'Blockchain Beyond Cryptocurrency',
    content: 'While Bitcoin remains the most famous application, blockchain technology is being explored for supply chain transparency, voting systems, and decentralized identity management. Its immutable ledger provides high security and trust.',
    category: 'technology',
    url: 'https://example.com/blockchain-future',
    snippet: 'Immutable ledgers are being used for everything from supply chains to secure voting systems.',
    date: '2024-04-12'
  },
  {
    id: '9',
    title: 'Understanding the Global Semiconductor Shortage',
    content: 'The complex supply chain of chips involves multiple countries and high-tech foundries. Shortages have impacted everything from cars to gaming consoles, highlighting the vulnerability of the global manufacturing ecosystem.',
    category: 'finance',
    url: 'https://example.com/semiconductor-crisis',
    snippet: 'The interconnected nature of chip manufacturing has led to widespread industrial disruptions.',
    date: '2024-04-15'
  },
  {
    id: '10',
    title: 'The Psychology of Deep Concentration (Flow State)',
    content: 'Flow stage, or being "in the zone," is a mental state where a person is fully immersed in an activity. Achieving it requires a balance between challenge and skill, and can significantly boost productivity and happiness.',
    category: 'lifestyle',
    url: 'https://example.com/flow-state',
    snippet: 'Discover the science of flow and how it can transform your relationship with work and creativity.',
    date: '2024-04-18'
  },
  {
    id: '11',
    title: 'Deep Learning for Natural Language Processing',
    content: 'Transformers and attention mechanisms have revolutionized how machines understand human language. Models like GPT and BERT are capable of complex reasoning and creative writing, changing the landscape of AI.',
    category: 'technology',
    url: 'https://example.com/nlp-deep-learning',
    snippet: 'The evolution of transformers has led to unpreceodented capabilities in machine translation and understanding.',
    date: '2024-04-20'
  },
  {
    id: '12',
    title: 'Marine Biology: Discovering Deep Sea Extremophiles',
    content: 'Creatures living near hydrothermal vents survive in pressures and temperatures that were once thought to be impossible for life. Studying these extremophiles helps us understand the potential for life on other planets.',
    category: 'science',
    url: 'https://example.com/marine-biology',
    snippet: 'Life at the bottom of the ocean challenges our understanding of biological limits.',
    date: '2024-04-22'
  },
  {
    id: '13',
    title: 'Personal Finance: Mastering the Art of Budgeting',
    content: 'Budgeting is the foundation of financial freedom. By tracking expenses and prioritizing savings, individuals can reach their long-term financial goals faster and with less stress.',
    category: 'finance',
    url: 'https://example.com/budgeting-mastery',
    snippet: 'Learn the practical steps to taking control of your financial future through disciplined budgeting.',
    date: '2024-04-24'
  }
];

// Automatically generate embeddings for all local mock documents
documents.forEach(doc => {
  doc.embedding = generateMockEmbedding(doc.content);
});
