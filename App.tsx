import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { cancelNotification, scheduleDeadline } from './src/notify';
import ClaimDetailScreen from './src/screens/ClaimDetailScreen';
import HomeScreen from './src/screens/HomeScreen';
import NewClaimScreen from './src/screens/NewClaimScreen';
import { loadClaims, removeClaimFiles, saveClaims } from './src/storage';
import { Claim } from './src/types';

type Route = { name: 'home' } | { name: 'new' } | { name: 'detail'; id: string };

export default function App() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<Route>({ name: 'home' });

  useEffect(() => {
    loadClaims().then((c) => {
      setClaims(c);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name !== 'home') {
        setRoute({ name: 'home' });
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [route]);

  const persist = useCallback((next: Claim[]) => {
    setClaims(next);
    saveClaims(next).catch(() => {});
  }, []);

  const create = async (c: Claim) => {
    const notifId = await scheduleDeadline(c.visitDate, c.hospital);
    persist([...claims, { ...c, notifId }]);
    setRoute({ name: 'detail', id: c.id });
  };

  const update = (c: Claim) => persist(claims.map((x) => (x.id === c.id ? c : x)));

  const remove = async (c: Claim) => {
    await cancelNotification(c.notifId);
    removeClaimFiles(c.id);
    persist(claims.filter((x) => x.id !== c.id));
    setRoute({ name: 'home' });
  };

  if (!ready) return <View style={{ flex: 1 }} />;

  const current = route.name === 'detail' ? claims.find((c) => c.id === route.id) : undefined;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      {route.name === 'new' ? (
        <NewClaimScreen onCancel={() => setRoute({ name: 'home' })} onCreate={create} />
      ) : current ? (
        <ClaimDetailScreen
          claim={current}
          onChange={update}
          onBack={() => setRoute({ name: 'home' })}
          onDelete={() => remove(current)}
        />
      ) : (
        <HomeScreen
          claims={claims}
          onNew={() => setRoute({ name: 'new' })}
          onOpen={(id) => setRoute({ name: 'detail', id })}
        />
      )}
    </View>
  );
}
