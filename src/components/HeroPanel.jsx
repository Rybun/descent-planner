import { useStore } from '../store';
import { HEROES, HEROES_BY_ID } from '../gamedata/heroes';
import { WEAPONS_BY_ID, PART_SLOTS } from '../gamedata/weapons';
import { WEAPON_PARTS_BY_ID, WEAPON_PARTS_BY_WEAPON } from '../gamedata/weaponParts';
import { ALL_ITEMS_BY_ID } from '../gamedata/items';
import './HeroPanel.css';

export default function HeroPanel() {
  const gameState = useStore(s => s.gameState);

  if (!gameState) return null;

  // Construir mapa de héroes con estado del save
  const heroesWithState = HEROES.map(hero => {
    const saveHero = gameState.heroes.find(h => h.id === hero.id);
    return { ...hero, saveData: saveHero || null };
  });

  return (
    <div className="hero-panel">
      {heroesWithState.map(hero => (
        <HeroCard key={hero.id} hero={hero} gameState={gameState} />
      ))}
    </div>
  );
}

function HeroCard({ hero, gameState }) {
  const { saveData } = hero;
  const isInParty = !!saveData;

  return (
    <div className={`hero-card ${isInParty ? 'hero-in-party' : 'hero-not-in-party'}`}>
      <div className="hero-header">
        <div className="hero-avatar-wrap">
          <img
            src={hero.image}
            alt={hero.name}
            className="hero-avatar"
            onError={e => { e.target.src = ''; e.target.className = 'hero-avatar hero-avatar-missing'; }}
          />
          {isInParty && <span className="in-party-dot" title="En el grupo" />}
        </div>
        <div className="hero-meta">
          <h3 className="hero-name">{hero.name}</h3>
          <span className="hero-archetype">{hero.archetype}</span>
          {!isInParty && (
            <span className="hero-absent">No está en la partida cargada</span>
          )}
        </div>
      </div>

      {isInParty && (
        <div className="hero-weapons">
          {hero.weapons.map(weaponId => (
            <WeaponRow
              key={weaponId}
              weaponId={weaponId}
              saveData={saveData}
              gameState={gameState}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeaponRow({ weaponId, saveData, gameState }) {
  const weapon = WEAPONS_BY_ID[weaponId];
  if (!weapon) return null;

  // Buscar el arma equipada en el save para este héroe
  const equippedWeapon = saveData?.equippedWeapons?.find(
    w => w.weaponType === weapon.weaponType || w.weaponId === weaponId
  );

  // Slots A, B, C
  const slots = ['A', 'B', 'C'];

  return (
    <div className="weapon-row">
      <div className="weapon-title">
        <span className="weapon-name">{weapon.name}</span>
        <span className="weapon-type-tag">{weapon.weaponType}</span>
      </div>
      <div className="weapon-slots">
        {slots.map(slot => {
          const partId = equippedWeapon?.[`part${slot}`] || null;
          const part = partId ? WEAPON_PARTS_BY_ID[partId] : null;

          // Buscar parte recién crafteada en inventario
          const craftedPart = findCraftedPartForSlot(
            weapon.weaponType, slot, gameState
          );

          return (
            <SlotCell
              key={slot}
              slot={slot}
              part={part}
              craftedPart={craftedPart}
              weaponType={weapon.weaponType}
            />
          );
        })}
      </div>
    </div>
  );
}

function findCraftedPartForSlot(weaponType, slot, gameState) {
  // Buscar si hay una receta crafteada para este weaponType + slot que no esté equipada aún
  const crafted = gameState.discoveredRecipes?.filter(r => r.crafted === true) || [];
  for (const recipe of crafted) {
    // recipe.id: RECIPE_WEAPON_PART_B_BOW_2
    const match = recipe.id.match(/RECIPE_WEAPON_PART_([A-C])_([A-Z_]+)_(\d+)/);
    if (!match) continue;
    const [, rSlot, rType, rLevel] = match;
    if (rSlot === slot && rType === weaponType) {
      const partId = `WEAPON_PART_${slot}_${weaponType}_${rLevel}`;
      return WEAPON_PARTS_BY_ID[partId] || null;
    }
  }
  return null;
}

function SlotCell({ slot, part, craftedPart, weaponType }) {
  const slotLabel = PART_SLOTS[slot] || slot;

  return (
    <div className={`slot-cell ${part ? 'slot-filled' : 'slot-empty'}`}>
      <span className="slot-label">Slot {slot}</span>
      <span className="slot-desc">{slotLabel}</span>

      {part ? (
        <div className="slot-part">
          {part.image && (
            <img
              src={part.image}
              alt={part.name}
              className="slot-part-img"
              onError={e => e.target.style.display = 'none'}
            />
          )}
          <div className="slot-part-info">
            <span className="slot-part-name">{part.name}</span>
            <span className="slot-part-level">Nv.{part.level}</span>
          </div>
        </div>
      ) : (
        <div className="slot-empty-label">
          {craftedPart ? (
            <span className="slot-crafted-pending" title="Receta crafteada, pendiente de equipar">
              🔨 {craftedPart.name} <em>(sin equipar)</em>
            </span>
          ) : (
            <span className="slot-none">— vacío —</span>
          )}
        </div>
      )}

      {craftedPart && part && craftedPart.id !== part.id && (
        <div className="slot-upgrade-hint">
          ↑ Puede mejorar a: {craftedPart.name} (Nv.{craftedPart.level})
        </div>
      )}
    </div>
  );
}
