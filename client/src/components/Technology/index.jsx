import { useEffect, useState } from 'react';
import Reveal from '../Reveal';

export default function Technology() {
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadTechnologies() {
      try {
        const response = await fetch('/api/technologies');

        if (!response.ok) {
          throw new Error('Failed to load technologies.');
        }

        const data = await response.json();

        if (active) {
          setTechnologies(data);
        }
      } catch (error) {
        console.error('Failed to load technologies:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTechnologies();

    return () => {
      active = false;
    };
  }, []);

  const groups = technologies.reduce((acc, technology) => {
    const categoryId = technology.categoryId;

    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: technology.category,
        items: [],
      };
    }

    acc[categoryId].items.push(technology.name);

    return acc;
  }, {});

  const categories = Object.values(groups);

  if (loading) {
    return (
      <section id="technology" className="section">
        <div className="wrap">
          <h2 className="sec-title">Technology</h2>
        </div>
      </section>
    );
  }

  return (
    <section id="technology" className="section">
      <div className="wrap">
        <h2 className="sec-title">Technology</h2>

        <div className="tech">
          {categories.map((category) => (
            <Reveal
              className="tech-col"
              key={category.id}
            >
              <h3>{category.name}</h3>

              <ul>
                {category.items.map((technology) => (
                  <li key={technology}>
                    {technology}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}