import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
} from "react-native";

interface Todo {
  id: number;
  name: string;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: 1,
      name: "Belajar React Native",
    },
    {
      id: 2,
      name: "Belajar Supabase",
    },
  ]);

  const [input, setInput] = useState("");

  const addTodo = () => {
    if (input.trim() === "") return;

    const newTodo: Todo = {
      id: Date.now(),
      name: input,
    };

    setTodos([...todos, newTodo]);
    setInput("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Todo List
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Tambah todo..."
        value={input}
        onChangeText={setInput}
      />

      <Pressable 
        style={styles.button}
        onPress={addTodo}
      >
        <Text style={styles.buttonText}>
          Tambah
        </Text>
      </Pressable>


      <FlatList
        data={todos}

        keyExtractor={(item) => item.id.toString()}

        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>
              {item.name}
            </Text>
          </View>
        )}
      />

    </View>
  );
}


const styles = StyleSheet.create({
  container:{
    flex:1,
    padding:20,
    justifyContent:"center",
  },

  title:{
    fontSize:24,
    fontWeight:"bold",
    marginBottom:20,
  },

  input:{
    borderWidth:1,
    borderColor:"#ccc",
    padding:10,
    borderRadius:8,
    marginBottom:10,
  },

  button:{
    backgroundColor:"black",
    padding:12,
    borderRadius:8,
    alignItems:"center",
    marginBottom:20,
  },

  buttonText:{
    color:"white",
    fontWeight:"bold",
  },

  card:{
    padding:15,
    borderWidth:1,
    borderColor:"#ddd",
    borderRadius:8,
    marginBottom:10,
  },

  text:{
    fontSize:16,
  },
});