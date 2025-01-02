import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { loadReminders } from './reminderService';
import { Reminder } from '../types';

export default class AIService {
  static model: tf.LayersModel | null = null;

  static async loadModel() {
    try {
      this.model = await tf.loadLayersModel('file://path/to/your/model.json');
    } catch (error) {
      console.error('Error loading AI model:', error);
    }
  }

  static async getSuggestions(): Promise<string[]> {
    if (!this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      console.error('AI model not loaded');
      return [];
    }

    const reminders = await loadReminders();
    const userContext = this.getUserContext();
    const input = this.prepareInput(reminders, userContext);

    const prediction = this.model.predict(input) as tf.Tensor;
    const suggestions = await this.decodePrediction(prediction);

    return suggestions;
  }

  private static getUserContext() {
    const now = new Date();
    return {
      dayOfWeek: now.getDay(),
      hour: now.getHours(),
      month: now.getMonth(),
    };
  }

  private static prepareInput(reminders: Reminder[], userContext: any): tf.Tensor2D {
    const reminderFeatures = reminders.map(r => [
      r.triggerType === 'time' ? 1 : 0,
      r.triggerType === 'location' ? 1 : 0,
      r.triggerType === 'condition' ? 1 : 0,
    ]);

    const contextFeatures = [
      userContext.dayOfWeek / 7,
      userContext.hour / 24,
      userContext.month / 12,
    ];

    const inputData = reminderFeatures.concat([contextFeatures]);
    return tf.tensor2d(inputData);
  }

  private static async decodePrediction(prediction: tf.Tensor): Promise<string[]> {
    const topK = 5;
    const values = await prediction.topk(topK).values.array();
    return (values as number[]).map(v => `Suggested reminder ${v.toFixed(2)}`);
  }
}

