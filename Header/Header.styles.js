import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    background: {
        backgroundColor: 'white',
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
    },
    top: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "90%",
        marginTop: 30,
    },
    title: {
        fontSize: 38,
        textAlign: "center",
    },
    leftIcon: {
        width: 40, // To reserve consistent space for alignment
    },
    rightIcon: {
        width: 40, // To reserve consistent space for alignment
        alignItems: "flex-end",
    },
    horizontalRule: {
        marginTop: 5,
        width: "90%",
        height: 4,
        backgroundColor: '#C6C6C6',
        alignSelf: "center",
    },
});

export default styles;