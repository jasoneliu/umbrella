import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PermissionModal = ({
  settingsFull,
  visible,
  setVisible,
}: {
  settingsFull: boolean;
  visible: boolean | undefined;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  let modalText = "";
  if (settingsFull) {
    modalText =
      'This app requires background location access for notifications.\n\n\
When you click the button below, you will be brought to the settings page.\n\
Please click Permissions → Location → "Allow all the time."';
  } else {
    modalText =
      'This app requires background location access for notifications.\n\n\
When you click the button below, you will be brought to the settings page.\n\
Please click "Allow all the time."';
  }

  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={() => {
          setVisible(false);
        }}
      >
        <View
          style={[
            styles.centeredView,
            { backgroundColor: "hsla(0, 0%, 0%, 0.6)" },
          ]}
        >
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{modalText}</Text>
            <TouchableOpacity
              activeOpacity={0.5}
              style={styles.modalButton}
              onPress={() => {
                setVisible(false);
              }}
            >
              <Text style={styles.modalButtonText}>
                Okay, take me to settings!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  modalView: {
    margin: 40,
    backgroundColor: "hsl(210, 10%, 20%)",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    marginTop: 20,
    backgroundColor: "hsl(169, 65%, 70%)",
  },
  modalText: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  modalButtonText: {
    fontSize: 16,
    color: "black",
  },
});

export default PermissionModal;
