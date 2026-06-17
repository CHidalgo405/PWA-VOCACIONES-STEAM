import { LocalVocationalCalibrationService } from './local-vocational-calibration.service';

describe('LocalVocationalCalibrationService', () => {
  let service: LocalVocationalCalibrationService;

  beforeEach(() => {
    service = new LocalVocationalCalibrationService();
  });

  it('builds local calibration signals from lived experiences', () => {
    const result = service.buildSignalResult('digital_consumption', {
      dc1: 'liked',
      dc2: 'liked',
      dc3: 'disliked',
      dc4: 'not_tried'
    });

    expect(result).toBeTruthy();
    expect(result?.positiveSignals).toBe(2);
    expect(result?.noExperienceAnswers).toBe(1);
    expect(result?.areaAdjustments.ciencia).toBeGreaterThan(0);
    expect(result?.areaAdjustments.tecnologia).toBeGreaterThan(0);
    expect(result?.confidenceBoost).toBeGreaterThan(0);
  });

  it('does not convert not-tried answers into API payload', () => {
    const apiPayload = service.toApiCompatibleAnswers({
      ph1: 'liked',
      ph2: 'not_tried',
      ph3: 'disliked'
    });

    expect(apiPayload).toEqual({
      ph1: 'liked',
      ph3: 'disliked'
    });
  });

  it('does not penalize a module with only not-tried answers', () => {
    const result = service.buildSignalResult('physical_hobbies', {
      ph1: 'not_tried',
      ph2: 'not_tried'
    });

    expect(result?.positiveSignals).toBe(0);
    expect(result?.confidenceBoost).toBe(0);
    expect(Object.values(result?.areaAdjustments || {}).every((score) => score === 0)).toBeTrue();
  });
});
