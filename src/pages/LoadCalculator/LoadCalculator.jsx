import React, { useState } from "react";
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

const unitConversions = {
  length: {
    m: 1,
    cm: 0.01,
    ft: 0.3048,
  },
  weight: {
    kg: 1,
    lb: 0.453592,
  },
};

const LoadCalculator = () => {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [lengthUnit, setLengthUnit] = useState("m");
  const [weightUnit, setWeightUnit] = useState("kg");

  const [result, setResult] = useState(null);

  const calculateLoad = () => {
    if (!length || !width || !height || !weight) return;

    const l = parseFloat(length) * unitConversions.length[lengthUnit];
    const w = parseFloat(width) * unitConversions.length[lengthUnit];
    const h = parseFloat(height) * unitConversions.length[lengthUnit];
    const wt = parseFloat(weight) * unitConversions.weight[weightUnit];

    const volume = l * w * h; // in m³

    // Simple load type classification
    let loadType = "";
    const density = wt / volume; // kg/m³
    if (density < 100) loadType = "Light";
    else if (density < 500) loadType = "Medium";
    else loadType = "Heavy";

    setResult({ volume, weight: wt, loadType });
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

    <div className="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Load Calculator</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Length</label>
          <input
            type="number"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="0"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <select
            value={lengthUnit}
            onChange={(e) => setLengthUnit(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="m">m</option>
            <option value="cm">cm</option>
            <option value="ft">ft</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Width</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="0"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Height</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="0"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Weight</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <select
            value={weightUnit}
            onChange={(e) => setWeightUnit(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
      </div>

      <button
        onClick={calculateLoad}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded mt-4 transition"
      >
        Calculate Load
      </button>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="text-xl font-semibold mb-2">Result</h3>
          <p>Volume: <span className="font-bold">{result.volume.toFixed(2)} m³</span></p>
          <p>Weight: <span className="font-bold">{result.weight.toFixed(2)} kg</span></p>
          <p>Load Type: <span className="font-bold">{result.loadType}</span></p>
        </div>
      )}
    </div>
        <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>);
};

export default LoadCalculator;