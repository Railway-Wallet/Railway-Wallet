import { InteractionManager } from "react-native";

export class ModalInteractionManager {
  private static interactionHandles: number[] = [];

  static startInteraction = () => {
    const handle = InteractionManager.createInteractionHandle();
    ModalInteractionManager.interactionHandles.push(handle);
  };

  static clearAllInteractions = () => {
    for (const handle of ModalInteractionManager.interactionHandles) {
      InteractionManager.clearInteractionHandle(handle);
    }

    ModalInteractionManager.interactionHandles = [];
  };
}
