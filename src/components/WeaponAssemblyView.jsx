import { WEAPON_ASSEMBLY, ASSEMBLY_CANVAS, ASSEMBLY_DISPLAY_H } from '../gamedata/weaponAssembly';

// partOverrides: { a|b|c: { left, top, w, h, z, rot } } — reemplaza campos del layout para ese slot
export default function WeaponAssemblyView({
  weaponType, partA, partB, partC,
  displayH = ASSEMBLY_DISPLAY_H,
  rotation = 0,
  partOverrides = {},
}) {
  const scale    = displayH / ASSEMBLY_CANVAS.h;
  const displayW = Math.round(ASSEMBLY_CANVAS.w * scale);
  const layout   = WEAPON_ASSEMBLY[weaponType];

  if (!layout) {
    return (
      <div style={{
        width: displayW, height: displayH,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-surface-raised)',
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
      }}>
        {partA?.image
          ? <img src={partA.image} alt=""
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
              onError={e => e.target.style.display = 'none'} />
          : <span style={{ fontSize: '3rem', opacity: 0.3 }}>⚔</span>
        }
      </div>
    );
  }

  const parts = { a: partA, b: partB, c: partC };

  return (
    <div style={{
      width: displayW, height: displayH,
      position: 'relative', flexShrink: 0, overflow: 'hidden',
      transform: rotation ? `rotate(${rotation}deg)` : undefined,
      transformOrigin: 'center center',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: ASSEMBLY_CANVAS.w, height: ASSEMBLY_CANVAS.h,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
      }}>
        {['a', 'b', 'c'].map(slot => {
          const l    = { ...layout[slot], ...(partOverrides[slot] || {}) };
          const part = parts[slot];
          if (!l || !part?.image) return null;

          const totalRot = l.rot || 0;

          let maskStyle = {};
          if (l.maskSlot && parts[l.maskSlot]?.image) {
            const ml      = layout[l.maskSlot];
            const maskUrl = `url("${parts[l.maskSlot].image}")`;
            const maskW   = ml ? `${ml.w}px`             : '100%';
            const maskH   = ml ? `${ml.h}px`             : '100%';
            const maskX   = ml ? `${ml.left - l.left}px` : '0px';
            const maskY   = ml ? `${ml.top  - l.top}px`  : '0px';
            maskStyle = {
              WebkitMaskImage: maskUrl, WebkitMaskSize: `${maskW} ${maskH}`,
              WebkitMaskPosition: `${maskX} ${maskY}`, WebkitMaskRepeat: 'no-repeat',
              maskImage: maskUrl, maskSize: `${maskW} ${maskH}`,
              maskPosition: `${maskX} ${maskY}`, maskRepeat: 'no-repeat',
            };
          }

          return (
            <img key={slot} src={part.image} alt=""
              style={{
                position: 'absolute',
                left: l.left, top: l.top, width: l.w, height: l.h,
                zIndex: l.z,
                transform: totalRot ? `rotate(${totalRot}deg)` : undefined,
                transformOrigin: 'center center',
                ...maskStyle,
              }}
              onError={e => e.target.style.display = 'none'}
            />
          );
        })}
        {!partA?.image && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '5rem', color: 'var(--color-text-disabled)', opacity: 0.4,
          }}>⚔</div>
        )}
      </div>
    </div>
  );
}
